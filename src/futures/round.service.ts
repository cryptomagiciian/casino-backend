import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class RoundService {
  private readonly logger = new Logger(RoundService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new trading round (called daily at midnight UTC)
   */
  @Cron('0 0 * * *') // Daily at midnight UTC
  async createNewRound() {
    try {
      this.logger.log('Creating new trading round...');

      // End current active round
      await this.endCurrentRound();

      // Generate new server seed
      const serverSeed = crypto.randomBytes(32).toString('hex');
      const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

      // Calculate round times (24 hours)
      const now = new Date();
      const startsAt = new Date(now);
      startsAt.setUTCHours(0, 0, 0, 0); // Start of current day

      const endsAt = new Date(startsAt);
      endsAt.setUTCDate(endsAt.getUTCDate() + 1); // End of current day

      // Create new round
      const newRound = await this.prisma.tradingRound.create({
        data: {
          serverSeed,
          serverSeedHash,
          startsAt,
          endsAt,
          intervalMs: 1000, // 1 second intervals
          isActive: true,
        },
      });

      this.logger.log(`New trading round created: ${newRound.id} (${serverSeedHash})`);
      
      return newRound;
    } catch (error) {
      this.logger.error('Failed to create new trading round:', error);
      throw error;
    }
  }

  /**
   * End the current active round
   */
  private async endCurrentRound() {
    const activeRound = await this.prisma.tradingRound.findFirst({
      where: { isActive: true },
    });

    if (activeRound) {
      await this.prisma.tradingRound.update({
        where: { id: activeRound.id },
        data: { isActive: false },
      });

      this.logger.log(`Ended trading round: ${activeRound.id}`);
    }
  }

  /**
   * Reveal server seed for a completed round (admin function)
   */
  async revealServerSeed(roundId: string): Promise<string> {
    try {
      const round = await this.prisma.tradingRound.findUnique({
        where: { id: roundId },
      });

      if (!round) {
        throw new Error('Trading round not found');
      }

      if (round.revealedAt) {
        throw new Error('Server seed already revealed for this round');
      }

      // Mark as revealed
      await this.prisma.tradingRound.update({
        where: { id: roundId },
        data: { revealedAt: new Date() },
      });

      this.logger.log(`Server seed revealed for round: ${roundId}`);
      
      return round.serverSeed;
    } catch (error) {
      this.logger.error(`Failed to reveal server seed for round ${roundId}:`, error);
      throw error;
    }
  }

  /**
   * Get current active round
   */
  async getCurrentRound() {
    return this.prisma.tradingRound.findFirst({
      where: {
        isActive: true,
        startsAt: { lte: new Date() },
        endsAt: { gte: new Date() },
      },
    });
  }

  /**
   * Get round by ID
   */
  async getRoundById(roundId: string) {
    return this.prisma.tradingRound.findUnique({
      where: { id: roundId },
    });
  }

  /**
   * Get all rounds with pagination
   */
  async getRounds(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    
    const [rounds, total] = await Promise.all([
      this.prisma.tradingRound.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tradingRound.count(),
    ]);

    return {
      rounds,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Initialize the first trading round if none exists
   */
  async initializeFirstRound() {
    const existingRound = await this.prisma.tradingRound.findFirst();
    
    if (!existingRound) {
      this.logger.log('No trading rounds found, creating initial round...');
      await this.createNewRound();
    }
  }
}
