import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { FairnessService } from '../fairness/fairness.service';
import { GamesService } from '../games/games.service';
import { BetPreview, BetPlaceRequest, BetResult } from '../shared/types';
import { Currency, Game } from '../shared/constants';
import { generateClientSeed, generateRng, toSmallestUnits, fromSmallestUnits } from '../shared/utils';
import { BetFiltersDto } from './dto/bet-filters.dto';

@Injectable()
export class BetsService {
  constructor(
    private prisma: PrismaService,
    private walletsService: WalletsService,
    private fairnessService: FairnessService,
    private gamesService: GamesService,
  ) {}

  /**
   * Preview a bet
   */
  async previewBet(request: BetPlaceRequest): Promise<BetPreview> {
    return this.gamesService.previewBet(
      request.game,
      request.currency,
      request.stake,
      request.params,
    );
  }

  /**
   * Place a bet
   */
  async placeBet(userId: string, request: BetPlaceRequest) {
    const { game, currency, stake, clientSeed, params } = request;

    // Preview bet to validate
    const preview = await this.previewBet(request);

    // Get current fairness seed
    const fairnessSeed = await this.fairnessService.getCurrentSeed(userId);

    // Use provided client seed or generate one
    const finalClientSeed = clientSeed || generateClientSeed();

    // Lock funds (default to mainnet for now, will be updated when frontend passes network)
    await this.walletsService.lockFunds(userId, currency, stake, 'bet_placement', 'mainnet');

    // Create bet record
    const bet = await this.prisma.bet.create({
      data: {
        userId,
        game,
        currency,
        stake: toSmallestUnits(stake, currency),
        potentialPayout: toSmallestUnits(preview.potentialPayout, currency),
        serverSeedHash: fairnessSeed.serverSeedHash,
        clientSeed: finalClientSeed,
        nonce: fairnessSeed.nonce,
        params: params || {},
        status: 'PENDING',
      },
    });

    return {
      id: bet.id,
      game: bet.game as Game,
      currency: bet.currency as Currency,
      stake,
      potentialPayout: preview.potentialPayout,
      clientSeed: finalClientSeed,
      serverSeedHash: fairnessSeed.serverSeedHash,
      nonce: fairnessSeed.nonce,
      status: 'PENDING',
    };
  }

  /**
   * Resolve a bet
   */
  async resolveBet(betId: string) {
    try {
      const bet = await this.prisma.bet.findUnique({
        where: { id: betId },
      });

      if (!bet) {
        throw new NotFoundException('Bet not found');
      }

      if (bet.status !== 'PENDING') {
        throw new BadRequestException('Bet already resolved');
      }

      // Get the server seed for this bet
      const fairnessSeed = await this.prisma.fairnessSeed.findFirst({
        where: {
          userId: bet.userId,
          serverSeedHash: bet.serverSeedHash,
        },
      });

      if (!fairnessSeed) {
        console.error(`Fairness seed not found for bet ${betId}, user ${bet.userId}`);
        throw new NotFoundException('Fairness seed not found');
      }

      // Generate RNG
      const rng = await generateRng(fairnessSeed.serverSeed, bet.clientSeed, bet.nonce);

      // Generate game outcome
      const outcome = this.generateGameOutcome(bet.game as Game, rng, bet.params as any);

      if (!outcome || typeof outcome.multiplier === 'undefined') {
        console.error(`Invalid game outcome for game ${bet.game}:`, outcome);
        throw new BadRequestException('Failed to generate game outcome');
      }

      // Calculate payout
      const stakeFloat = parseFloat(fromSmallestUnits(bet.stake, bet.currency as Currency));
      const payout = stakeFloat * outcome.multiplier;
      const payoutSmallest = toSmallestUnits(payout.toString(), bet.currency as Currency);

      // Update bet with outcome
      const updatedBet = await this.prisma.bet.update({
        where: { id: betId },
        data: {
          outcome: outcome.result,
          resultMultiplier: outcome.multiplier,
          status: outcome.multiplier > 0 ? 'WON' : 'LOST',
          rngTrace: {
            serverSeed: fairnessSeed.serverSeed,
            clientSeed: bet.clientSeed,
            nonce: bet.nonce,
            rng,
            outcome,
            ...((outcome as any).rngTrace || {}), // Include pump_or_dump specific trace data
          },
          resolvedAt: new Date(),
        },
      });

      // Handle funds
      if (outcome.multiplier > 0) {
        // Credit winnings
        await this.walletsService.creditWinnings(
          bet.userId,
          bet.currency as Currency,
          payout.toString(),
          betId,
          'mainnet', // TODO: Get network from bet metadata
        );
      }

      // Release locked funds
      await this.walletsService.releaseFunds(
        bet.userId,
        bet.currency as Currency,
        fromSmallestUnits(bet.stake, bet.currency as Currency),
        betId,
        'mainnet', // TODO: Get network from bet metadata
      );

      return {
        id: bet.id,
        game: bet.game as Game,
        currency: bet.currency as Currency,
        stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
        outcome: outcome.result,
        resultMultiplier: outcome.multiplier,
        payout: payout.toString(),
        status: outcome.multiplier > 0 ? 'WON' : 'LOST',
        rngTrace: updatedBet.rngTrace,
      };
    } catch (error) {
      console.error(`Error resolving bet ${betId}:`, error);
      throw error;
    }
  }

  /**
   * Cash out a bet (for crash games)
   */
  async cashoutBet(betId: string, cashoutMultiplier?: number) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.status !== 'PENDING') {
      throw new BadRequestException('Bet already resolved');
    }

    // Games that support cashout
    const cashoutGames = ['freeze_the_bag', 'to_the_moon', 'leverage_ladder'];
    if (!cashoutGames.includes(bet.game)) {
      throw new BadRequestException('This game does not support cashout');
    }

    // Use provided multiplier or default to 1.0 (return stake)
    const actualMultiplier = cashoutMultiplier || 1.0;
    
    // Minimum multiplier of 1.0 (can't cash out for less than stake)
    const finalMultiplier = Math.max(1.0, actualMultiplier);
    
    const stakeFloat = parseFloat(fromSmallestUnits(bet.stake, bet.currency as Currency));
    const payout = stakeFloat * finalMultiplier;

    const updatedBet = await this.prisma.bet.update({
      where: { id: betId },
      data: {
        outcome: 'cashed_out',
        resultMultiplier: finalMultiplier,
        status: 'CASHED_OUT',
        resolvedAt: new Date(),
      },
    });

    // Credit winnings
    await this.walletsService.creditWinnings(
      bet.userId,
      bet.currency as Currency,
      payout.toString(),
      betId,
      'mainnet', // TODO: Get network from bet metadata
    );

    // Release locked funds
    await this.walletsService.releaseFunds(
      bet.userId,
      bet.currency as Currency,
      fromSmallestUnits(bet.stake, bet.currency as Currency),
      betId,
      'mainnet', // TODO: Get network from bet metadata
    );

    return {
      id: bet.id,
      game: bet.game as Game,
      currency: bet.currency as Currency,
      stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
      outcome: 'cashed_out',
      resultMultiplier: finalMultiplier,
      payout: payout.toString(),
      status: 'CASHED_OUT',
    };
  }

  /**
   * Get bet details
   */
  async getBet(betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    return {
      id: bet.id,
      game: bet.game as Game,
      currency: bet.currency as Currency,
      stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
      potentialPayout: fromSmallestUnits(bet.potentialPayout, bet.currency as Currency),
      outcome: bet.outcome,
      resultMultiplier: bet.resultMultiplier,
      status: bet.status,
      serverSeedHash: bet.serverSeedHash,
      clientSeed: bet.clientSeed,
      nonce: bet.nonce,
      revealedServerSeed: bet.revealedServerSeed,
      rngTrace: bet.rngTrace,
      params: bet.params,
      createdAt: bet.createdAt,
      resolvedAt: bet.resolvedAt,
    };
  }

  /**
   * Get user's bets
   */
  async getUserBets(userId: string, limit: number = 50, offset: number = 0) {
    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.bet.count({
        where: { userId },
      }),
    ]);

    return {
      bets: bets.map(bet => ({
        id: bet.id,
        game: bet.game as Game,
        currency: bet.currency as Currency,
        stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
        potentialPayout: fromSmallestUnits(bet.potentialPayout, bet.currency as Currency),
        outcome: bet.outcome,
        resultMultiplier: bet.resultMultiplier,
        status: bet.status,
        createdAt: bet.createdAt,
        resolvedAt: bet.resolvedAt,
      })),
      total,
    };
  }

  /**
   * Get user bets with filters
   */
  async getUserBetsWithFilters(userId: string, filters: BetFiltersDto) {
    const where: any = { userId };

    // Apply filters
    if (filters.game) {
      where.game = filters.game;
    }

    if (filters.status) {
      if (filters.status === 'won') {
        where.outcome = 'win';
        where.resultMultiplier = { gt: 0 };
      } else if (filters.status === 'lost') {
        where.outcome = 'lose';
        where.resultMultiplier = 0;
      } else if (filters.status === 'pending') {
        where.resolvedAt = null;
      }
    }

    if (filters.currency) {
      where.currency = filters.currency;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const limit = parseInt(filters.limit || '50');
    const offset = parseInt(filters.offset || '0');

    const [bets, total] = await Promise.all([
      this.prisma.bet.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.bet.count({
        where,
      }),
    ]);

    return {
      bets: bets.map(bet => ({
        id: bet.id,
        game: bet.game as Game,
        currency: bet.currency as Currency,
        stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
        potentialPayout: fromSmallestUnits(bet.potentialPayout, bet.currency as Currency),
        outcome: bet.outcome,
        resultMultiplier: bet.resultMultiplier,
        status: bet.status,
        createdAt: bet.createdAt,
        resolvedAt: bet.resolvedAt,
      })),
      total,
    };
  }

  /**
   * Generate Pump or Dump outcome with configurable house edge
   */
  private generatePumpOrDumpOutcome(rng: number, params?: any) {
    // Configurable house edge (2-3.5%)
    const PAYOUT_MULTIPLIER = 1.95; // Default payout
    const HOUSE_EDGE = 0.0256; // 2.56% house edge
    
    // Calculate win probability: pWin = (1 / payout) * (1 - houseEdge)
    const pWin = (1 / PAYOUT_MULTIPLIER) * (1 - HOUSE_EDGE); // ≈ 0.487
    
    const userChoice = params?.choice || params?.prediction || 'pump';
    const userPickedPump = userChoice.toLowerCase() === 'pump';
    
    // Determine if user wins
    const willWin = rng < pWin;
    
    // Outcome: if user wins, they get their choice; if they lose, they get the opposite
    const outcome = willWin ? userChoice : (userPickedPump ? 'dump' : 'pump');
    
    // Generate volatility profile and end magnitude for path simulation
    const profileSeed = rng * 1000000; // Use rng to seed profile generation
    const profiles = ['spiky', 'meanRevert', 'trendThenSnap', 'chopThenRip'];
    const profile = profiles[Math.floor(profileSeed % profiles.length)];
    
    // End magnitude: 25-180 basis points (0.25% - 1.8%)
    const endBps = 25 + (profileSeed % 155); // 25-180 bps
    
    return {
      result: willWin ? 'win' : 'lose',
      multiplier: willWin ? PAYOUT_MULTIPLIER : 0,
      outcome: outcome,
      rngTrace: {
        pWin,
        profile,
        endBps,
        userChoice,
        willWin,
        rng
      }
    };
  }

  /**
   * Generate game outcome based on RNG
   */
  private generateGameOutcome(game: Game, rng: number, params?: any) {
    // This is a simplified version - the full implementation would be in the fairness service
    switch (game) {
      case 'pump_or_dump':
        return this.generatePumpOrDumpOutcome(rng, params);
      
      case 'candle_flip':
      case 'bull_vs_bear_battle':
        // HOUSE EDGE: 44% win chance × 1.88× payout = ~17% house edge
        const winChance = 0.44;
        const won = rng < winChance;
        return {
          result: won ? 'win' : 'lose',
          multiplier: won ? 1.88 : 0,
        };

      case 'support_or_resistance':
        const srWinChance = 0.485;
        const srWon = rng < srWinChance;
        return {
          result: srWon ? 'win' : 'lose',
          multiplier: srWon ? 2.02 : 0,
        };

      case 'leverage_ladder':
        const targetRung = params?.targetRung || 0;
        const multipliers = [1.3, 1.69, 2.19, 2.85, 3.7, 4.8];
        const ladderMultiplier = multipliers[targetRung] || 1.0;
        const ladderWinChance = Math.pow(0.9, targetRung + 1);
        const ladderWon = rng < ladderWinChance;
        return {
          result: ladderWon ? 'win' : 'lose',
          multiplier: ladderWon ? ladderMultiplier : 0,
        };

      case 'stop_loss_roulette':
        const stopLossDistance = params?.stopLossDistance || 0.1;
        const slMultiplier = Math.min(4.0, 1 + (0.5 / stopLossDistance));
        const slWinChance = 1 / slMultiplier;
        const slWon = rng < slWinChance;
        return {
          result: slWon ? 'win' : 'lose',
          multiplier: slWon ? slMultiplier : 0,
        };

      case 'freeze_the_bag':
      case 'to_the_moon':
        // Simulate crash point
        const crashProbability = 0.01;
        let currentMultiplier = 1.0;
        let crashed = false;
        
        while (!crashed && currentMultiplier < 100) {
          const stepRng = (rng * currentMultiplier) % 1;
          if (stepRng < crashProbability) {
            crashed = true;
            break;
          }
          currentMultiplier += 0.01;
        }
        
        return {
          result: crashed ? 'crash' : 'continue',
          multiplier: crashed ? 0 : currentMultiplier,
        };

      case 'diamond_hands':
        const mines = params?.mines || 3;
        const picks = params?.picks || [];
        const gridSize = 25;
        
        // Generate mine positions deterministically
        const minePositions = [];
        let mineRng = rng;
        
        while (minePositions.length < mines) {
          const pos = Math.floor(mineRng * gridSize);
          if (!minePositions.includes(pos)) {
            minePositions.push(pos);
          }
          mineRng = (mineRng * 1.618) % 1;
        }
        
        // Check picks
        let dhMultiplier = 1.0;
        let hitMine = false;
        
        for (const pick of picks) {
          if (minePositions.includes(pick)) {
            hitMine = true;
            break;
          }
          dhMultiplier += 0.1;
        }
        
        return {
          result: hitMine ? 'lose' : 'win',
          multiplier: hitMine ? 0 : dhMultiplier,
        };

      default:
        throw new BadRequestException(`Unknown game: ${game}`);
    }
  }

  /**
   * Get recent wins across all users for live wins feed
   */
  async getLiveWins(limit: number = 20) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const wins = await this.prisma.bet.findMany({
      where: {
        outcome: 'win',
        resultMultiplier: { gt: 0 },
        resolvedAt: { gte: twentyFourHoursAgo },
      },
      include: {
        user: {
          select: {
            handle: true,
          },
        },
      },
      orderBy: {
        resolvedAt: 'desc',
      },
      take: limit,
    });

    return {
      wins: wins.map(win => ({
        id: win.id,
        username: win.user.handle,
        game: this.formatGameName(win.game),
        gameSlug: this.getGameSlug(win.game),
        amount: fromSmallestUnits(win.stake, win.currency as Currency).toString(),
        multiplier: win.resultMultiplier,
        payout: fromSmallestUnits(
          BigInt(Math.floor(parseFloat(fromSmallestUnits(win.stake, win.currency as Currency)) * win.resultMultiplier)),
          win.currency as Currency
        ).toString(),
        currency: win.currency,
        timestamp: win.resolvedAt.toISOString(),
      })),
    };
  }

  private formatGameName(game: string): string {
    const gameNames: Record<string, string> = {
      'pump_or_dump': 'Pump or Dump',
      'candle_flip': 'Candle Flip',
      'support_or_resistance': 'Support or Resistance',
      'bull_vs_bear_battle': 'Bull vs Bear',
      'leverage_ladder': 'Leverage Ladder',
      'stop_loss_roulette': 'Stop Loss Roulette',
      'freeze_the_bag': 'Freeze the Bag',
      'to_the_moon': 'To the Moon',
      'diamond_hands': 'Diamond Hands',
      'crypto_slots': 'Crypto Slots',
    };
    return gameNames[game] || game;
  }

  private getGameSlug(game: string): string {
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
    return gameSlugs[game] || game;
  }
}
