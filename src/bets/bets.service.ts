import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { FairnessService } from '../fairness/fairness.service';
import { GamesService } from '../games/games.service';
import { BetPreview, BetPlaceRequest, BetResult } from '../shared/types';
import { Currency, Game } from '../shared/constants';
import { generateClientSeed, generateRng, toSmallestUnits, fromSmallestUnits } from '../shared/utils';

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

    // Lock funds
    await this.walletsService.lockFunds(userId, currency, stake, 'bet_placement');

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
      throw new NotFoundException('Fairness seed not found');
    }

    // Generate RNG
    const rng = await generateRng(fairnessSeed.serverSeed, bet.clientSeed, bet.nonce);

    // Generate game outcome
    const outcome = this.generateGameOutcome(bet.game as Game, rng, bet.params as any);

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
      );
    }

    // Release locked funds
    await this.walletsService.releaseFunds(
      bet.userId,
      bet.currency as Currency,
      fromSmallestUnits(bet.stake, bet.currency as Currency),
      betId,
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
  }

  /**
   * Cash out a bet (for crash games)
   */
  async cashoutBet(betId: string) {
    const bet = await this.prisma.bet.findUnique({
      where: { id: betId },
    });

    if (!bet) {
      throw new NotFoundException('Bet not found');
    }

    if (bet.status !== 'PENDING') {
      throw new BadRequestException('Bet already resolved');
    }

    // Only crash games support cashout
    if (!['freeze_the_bag', 'to_the_moon'].includes(bet.game)) {
      throw new BadRequestException('This game does not support cashout');
    }

    // For now, we'll resolve the bet with a manual cashout
    // In a real implementation, this would depend on the current multiplier
    const stakeFloat = parseFloat(fromSmallestUnits(bet.stake, bet.currency as Currency));
    const cashoutMultiplier = 2.0; // Example multiplier
    const payout = stakeFloat * cashoutMultiplier;

    const updatedBet = await this.prisma.bet.update({
      where: { id: betId },
      data: {
        outcome: 'cashed_out',
        resultMultiplier: cashoutMultiplier,
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
    );

    // Release locked funds
    await this.walletsService.releaseFunds(
      bet.userId,
      bet.currency as Currency,
      fromSmallestUnits(bet.stake, bet.currency as Currency),
      betId,
    );

    return {
      id: bet.id,
      game: bet.game as Game,
      currency: bet.currency as Currency,
      stake: fromSmallestUnits(bet.stake, bet.currency as Currency),
      outcome: 'cashed_out',
      resultMultiplier: cashoutMultiplier,
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
   * Generate game outcome based on RNG
   */
  private generateGameOutcome(game: Game, rng: number, params?: any) {
    // This is a simplified version - the full implementation would be in the fairness service
    switch (game) {
      case 'candle_flip':
      case 'pump_or_dump':
      case 'bull_vs_bear_battle':
        const winChance = 0.495;
        const won = rng < winChance;
        return {
          result: won ? 'win' : 'lose',
          multiplier: won ? 1.98 : 0,
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
}
