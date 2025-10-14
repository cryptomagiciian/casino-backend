import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Game, GAME_CONFIGS, DEFAULT_HOUSE_EDGE_BPS } from '../shared/constants';
import { BetPreview } from '../shared/types';
import { calculateHouseEdgeMultiplier, toSmallestUnits, fromSmallestUnits } from '../shared/utils';

@Injectable()
export class GamesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all available games
   */
  async getGames() {
    const games = Object.entries(GAME_CONFIGS).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      houseEdge: config.houseEdgeBps / 100, // Convert to percentage
      rtp: 100 - (config.houseEdgeBps / 100), // Return to player percentage
    }));

    return games;
  }

  /**
   * Get game configuration
   */
  async getGameConfig(game: Game) {
    const config = GAME_CONFIGS[game];
    if (!config) {
      throw new NotFoundException(`Game ${game} not found`);
    }

    // Get custom config from database if exists
    const dbConfig = await this.prisma.gameConfig.findUnique({
      where: { game },
    });

    return {
      ...config,
      houseEdgeBps: dbConfig?.houseEdgeBps || config.houseEdgeBps,
      params: dbConfig?.params || {},
    };
  }

  /**
   * Preview a bet (calculate potential payout)
   */
  async previewBet(
    game: Game,
    currency: string,
    stake: string,
    params?: any,
  ): Promise<BetPreview> {
    const config = await this.getGameConfig(game);
    
    // Validate stake amount
    const stakeSmallest = toSmallestUnits(stake, currency as any);
    if (stakeSmallest <= 0n) {
      throw new BadRequestException('Invalid stake amount');
    }

    // Calculate win chance and multiplier based on game
    const { winChance, multiplier } = this.calculateGameOdds(game, config, params);

    // Calculate potential payout
    const stakeFloat = parseFloat(stake);
    const potentialPayout = stakeFloat * multiplier;
    const potentialPayoutSmallest = toSmallestUnits(potentialPayout.toString(), currency as any);

    return {
      game,
      currency: currency as any,
      stake,
      potentialPayout: fromSmallestUnits(potentialPayoutSmallest, currency as any),
      winChance,
      multiplier,
      houseEdge: config.houseEdgeBps / 100,
    };
  }

  /**
   * Calculate game odds based on game type and parameters
   */
  private calculateGameOdds(game: Game, config: any, params?: any) {
    switch (game) {
      case 'candle_flip':
      case 'pump_or_dump':
      case 'bull_vs_bear_battle':
        return {
          winChance: config.winChance,
          multiplier: config.multiplier,
        };

      case 'support_or_resistance':
        return {
          winChance: config.winChance,
          multiplier: config.multiplier,
        };

      case 'leverage_ladder':
        const targetRung = params?.targetRung || 0;
        const multipliers = config.multipliers;
        const ladderMultiplier = multipliers[targetRung] || 1.0;
        // Calculate win chance based on target rung (higher rungs = lower chance)
        const ladderWinChance = Math.pow(0.9, targetRung + 1); // 90% chance each step
        return { winChance: ladderWinChance, multiplier: ladderMultiplier };

      case 'stop_loss_roulette':
        const stopLossDistance = params?.stopLossDistance || 0.1;
        const maxMultiplier = config.maxMultiplier;
        const slMultiplier = Math.min(maxMultiplier, 1 + (0.5 / stopLossDistance));
        const slWinChance = 1 / slMultiplier;
        return { winChance: slWinChance, multiplier: slMultiplier };

      case 'freeze_the_bag':
      case 'to_the_moon':
        // These games have variable multipliers, return base values
        return {
          winChance: 0.5, // Approximate
          multiplier: 2.0, // Base multiplier
        };

      case 'diamond_hands':
        const mines = params?.mines || 3;
        const gridSize = config.gridSize;
        const safeSpots = gridSize - mines;
        const dhWinChance = safeSpots / gridSize;
        const dhMultiplier = 1.0 + (safeSpots * 0.1); // Increase multiplier for each safe spot
        return { winChance: dhWinChance, multiplier: dhMultiplier };

      default:
        throw new BadRequestException(`Unknown game: ${game}`);
    }
  }

  /**
   * Search games by name, description, or type
   */
  async searchGames(query: string, limit: number = 10) {
    if (!query || query.trim().length === 0) {
      return { results: [] };
    }

    const searchTerm = query.toLowerCase().trim();
    const allGames = Object.entries(GAME_CONFIGS);
    
    const results = allGames
      .filter(([id, config]) => {
        const name = config.name.toLowerCase();
        const description = config.description.toLowerCase();
        const type = config.type?.toLowerCase() || '';
        const slug = this.getGameSlug(id);
        
        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          type.includes(searchTerm) ||
          slug.includes(searchTerm) ||
          id.toLowerCase().includes(searchTerm)
        );
      })
      .slice(0, limit)
      .map(([id, config]) => ({
        slug: this.getGameSlug(id),
        name: config.name,
        type: config.type || 'prediction',
        description: config.description,
        minBet: '1.00',
        maxBet: '10000.00',
      }));

    return { results };
  }

  private getGameSlug(gameId: string): string {
    const gameSlugs: Record<string, string> = {
      'pump_or_dump': 'pump-or-dump',
      'candle_flip': 'candle-flip',
      'support_or_resistance': 'support-or-resistance',
      'bull_vs_bear_battle': 'bull-vs-bear',
      'leverage_ladder': 'leverage-ladder',
      'stop_loss_roulette': 'bullet-bet',
      'freeze_the_bag': 'freeze-the-bag',
      'to_the_moon': 'to-the-moon',
      'diamond_hands': 'diamond-hands',
      'crypto_slots': 'crypto-slots',
    };
    return gameSlugs[gameId] || gameId;
  }

  /**
   * Update game configuration (admin only)
   */
  async updateGameConfig(game: Game, houseEdgeBps?: number, params?: any) {
    return this.prisma.gameConfig.upsert({
      where: { game },
      update: {
        houseEdgeBps: houseEdgeBps || DEFAULT_HOUSE_EDGE_BPS,
        params: params || {},
      },
      create: {
        game,
        houseEdgeBps: houseEdgeBps || DEFAULT_HOUSE_EDGE_BPS,
        params: params || {},
      },
    });
  }
}
