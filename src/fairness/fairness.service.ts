import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FairnessSeed, FairnessVerifyRequest, FairnessVerifyResult } from '../shared/types';
import { generateRng, sha256 } from '../shared/utils';
import { Game } from '../shared/constants';

@Injectable()
export class FairnessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get current fairness seed for user
   */
  async getCurrentSeed(userId: string): Promise<FairnessSeed> {
    const seed = await this.prisma.fairnessSeed.findFirst({
      where: {
        userId,
        active: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!seed) {
      throw new NotFoundException('No active fairness seed found');
    }

    // Get next nonce
    const nonce = await this.getNextNonce(userId);

    return {
      serverSeedHash: seed.serverSeedHash,
      nonce,
    };
  }

  /**
   * Rotate fairness seed (admin only)
   */
  async rotateSeed(userId: string) {
    // Deactivate current seed
    await this.prisma.fairnessSeed.updateMany({
      where: {
        userId,
        active: true,
      },
      data: {
        active: false,
      },
    });

    // Create new seed
    const serverSeed = this.generateServerSeed();
    const serverSeedHash = await sha256(serverSeed);

    return this.prisma.fairnessSeed.create({
      data: {
        userId,
        serverSeed,
        serverSeedHash,
        active: true,
      },
    });
  }

  /**
   * Reveal server seed (admin only)
   */
  async revealSeed(userId: string, seedId: string) {
    const seed = await this.prisma.fairnessSeed.findFirst({
      where: {
        id: seedId,
        userId,
      },
    });

    if (!seed) {
      throw new NotFoundException('Fairness seed not found');
    }

    if (seed.revealedAt) {
      throw new BadRequestException('Seed already revealed');
    }

    return this.prisma.fairnessSeed.update({
      where: { id: seedId },
      data: {
        revealedAt: new Date(),
      },
    });
  }

  /**
   * Verify fairness of a bet
   */
  async verifyFairness(request: FairnessVerifyRequest): Promise<FairnessVerifyResult> {
    try {
      const { serverSeed, clientSeed, nonce, game, betId } = request;

      // If betId is provided, get the bet details
      let bet = null;
      if (betId) {
        bet = await this.prisma.bet.findUnique({
          where: { id: betId },
        });
      }

      // Generate RNG value
      const rng = await generateRng(serverSeed, clientSeed, nonce);

      // Verify server seed hash
      const expectedHash = await sha256(serverSeed);
      const providedHash = bet?.serverSeedHash || '';

      if (bet && expectedHash !== providedHash) {
        return {
          valid: false,
          error: 'Server seed hash mismatch',
        };
      }

      // Generate game outcome based on RNG
      const outcome = this.generateGameOutcome(game, rng, bet?.params as any);

      return {
        valid: true,
        outcome: outcome.result,
        multiplier: outcome.multiplier,
        rngTrace: {
          serverSeed,
          clientSeed,
          nonce,
          rng,
          game,
          outcome,
        },
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get next nonce for user
   */
  private async getNextNonce(userId: string): Promise<number> {
    const lastBet = await this.prisma.bet.findFirst({
      where: { userId },
      orderBy: { nonce: 'desc' },
    });

    return (lastBet?.nonce || 0) + 1;
  }

  /**
   * Generate server seed
   */
  private generateServerSeed(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate game outcome based on RNG
   */
  private generateGameOutcome(game: Game, rng: number, params?: any) {
    switch (game) {
      case 'candle_flip':
        return this.generateCandleFlipOutcome(rng, params);
      case 'pump_or_dump':
        return this.generatePumpOrDumpOutcome(rng, params);
      case 'support_or_resistance':
        return this.generateSupportOrResistanceOutcome(rng, params);
      case 'bull_vs_bear_battle':
        return this.generateBullVsBearOutcome(rng, params);
      case 'leverage_ladder':
        return this.generateLeverageLadderOutcome(rng, params);
      case 'stop_loss_roulette':
        return this.generateStopLossRouletteOutcome(rng, params);
      case 'freeze_the_bag':
        return this.generateFreezeTheBagOutcome(rng, params);
      case 'to_the_moon':
        return this.generateToTheMoonOutcome(rng, params);
      case 'diamond_hands':
        return this.generateDiamondHandsOutcome(rng, params);
      default:
        throw new BadRequestException(`Unknown game: ${game}`);
    }
  }

  private generateCandleFlipOutcome(rng: number, params: any) {
    const winChance = 0.495;
    const won = rng < winChance;
    const multiplier = won ? 1.98 : 0;
    
    return {
      result: won ? 'win' : 'lose',
      multiplier,
      details: {
        rng,
        winChance,
        prediction: params?.prediction,
      },
    };
  }

  private generatePumpOrDumpOutcome(rng: number, params: any) {
    const winChance = 0.495;
    const won = rng < winChance;
    const multiplier = won ? 1.98 : 0;
    
    return {
      result: won ? 'win' : 'lose',
      multiplier,
      details: {
        rng,
        winChance,
        prediction: params?.prediction,
      },
    };
  }

  private generateSupportOrResistanceOutcome(rng: number, params: any) {
    const winChance = 0.485;
    const won = rng < winChance;
    const multiplier = won ? 2.02 : 0;
    
    return {
      result: won ? 'win' : 'lose',
      multiplier,
      details: {
        rng,
        winChance,
        prediction: params?.prediction,
        level: params?.level,
      },
    };
  }

  private generateBullVsBearOutcome(rng: number, params: any) {
    const winChance = 0.49;
    const won = rng < winChance;
    const multiplier = won ? 2.0 : 0;
    
    return {
      result: won ? 'win' : 'lose',
      multiplier,
      details: {
        rng,
        winChance,
        prediction: params?.prediction,
      },
    };
  }

  private generateLeverageLadderOutcome(rng: number, params: any) {
    const targetRung = params?.targetRung || 0;
    const multipliers = [1.3, 1.69, 2.19, 2.85, 3.7, 4.8];
    
    // Simulate ladder progression
    let currentRung = 0;
    let busted = false;
    
    for (let i = 0; i <= targetRung; i++) {
      const stepRng = (rng * (i + 1)) % 1; // Use different RNG for each step
      if (stepRng < 0.1) { // 10% chance to bust each step
        busted = true;
        break;
      }
      currentRung = i;
    }
    
    const multiplier = busted ? 0 : multipliers[currentRung];
    
    return {
      result: busted ? 'lose' : 'win',
      multiplier,
      details: {
        rng,
        targetRung,
        achievedRung: currentRung,
        busted,
      },
    };
  }

  private generateStopLossRouletteOutcome(rng: number, params: any) {
    const stopLossDistance = params?.stopLossDistance || 0.1; // 10% default
    const maxMultiplier = 4.0;
    
    // Dynamic payout based on stop loss distance
    const multiplier = Math.min(maxMultiplier, 1 + (0.5 / stopLossDistance));
    const winChance = 1 / multiplier;
    
    const won = rng < winChance;
    const finalMultiplier = won ? multiplier : 0;
    
    return {
      result: won ? 'win' : 'lose',
      multiplier: finalMultiplier,
      details: {
        rng,
        stopLossDistance,
        winChance,
        maxMultiplier,
      },
    };
  }

  private generateFreezeTheBagOutcome(rng: number, params: any) {
    const crashProbability = 0.01; // 1% chance to crash each step
    let multiplier = 1.0;
    let crashed = false;
    
    // Simulate crash point
    while (!crashed && multiplier < 100) {
      const stepRng = (rng * multiplier) % 1;
      if (stepRng < crashProbability) {
        crashed = true;
        break;
      }
      multiplier += 0.01;
    }
    
    return {
      result: crashed ? 'crash' : 'continue',
      multiplier: crashed ? 0 : multiplier,
      details: {
        rng,
        crashProbability,
        crashPoint: crashed ? multiplier : null,
      },
    };
  }

  private generateToTheMoonOutcome(rng: number, params: any) {
    const crashProbability = 0.01;
    let multiplier = 1.0;
    let crashed = false;
    
    // Simulate crash point
    while (!crashed && multiplier < 1000) {
      const stepRng = (rng * multiplier) % 1;
      if (stepRng < crashProbability) {
        crashed = true;
        break;
      }
      multiplier += 0.01;
    }
    
    return {
      result: crashed ? 'crash' : 'continue',
      multiplier: crashed ? 0 : multiplier,
      details: {
        rng,
        crashProbability,
        crashPoint: crashed ? multiplier : null,
      },
    };
  }

  private generateDiamondHandsOutcome(rng: number, params: any) {
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
      mineRng = (mineRng * 1.618) % 1; // Golden ratio for next position
    }
    
    // Check picks
    let multiplier = 1.0;
    let hitMine = false;
    
    for (const pick of picks) {
      if (minePositions.includes(pick)) {
        hitMine = true;
        break;
      }
      multiplier += 0.1; // Increase multiplier for each safe pick
    }
    
    return {
      result: hitMine ? 'lose' : 'win',
      multiplier: hitMine ? 0 : multiplier,
      details: {
        rng,
        mines,
        minePositions,
        picks,
        hitMine,
      },
    };
  }
}
