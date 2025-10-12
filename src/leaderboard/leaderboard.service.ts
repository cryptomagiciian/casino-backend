import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardEntry } from '../shared/types';
import { fromSmallestUnits } from '../shared/utils';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get daily leaderboard
   */
  async getDailyLeaderboard(date?: Date, limit: number = 100) {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    const leaderboard = await this.prisma.leaderboardDaily.findMany({
      where: {
        date: targetDate,
      },
      orderBy: {
        pnl: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            handle: true,
          },
        },
      },
    });

    return leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      handle: entry.user.handle,
      pnl: fromSmallestUnits(entry.pnl, 'USDC'), // Assuming USDC for leaderboard
      currency: 'USDC' as const,
    }));
  }

  /**
   * Update user's daily PnL
   */
  async updateDailyPnL(userId: string, pnl: bigint, currency: string, date?: Date) {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Upsert leaderboard entry
    const entry = await this.prisma.leaderboardDaily.upsert({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
      update: {
        pnl: {
          increment: pnl,
        },
      },
      create: {
        userId,
        pnl,
        date: targetDate,
      },
    });

    // Update ranks for the day
    await this.updateDailyRanks(targetDate);

    return entry;
  }

  /**
   * Update daily ranks
   */
  private async updateDailyRanks(date: Date) {
    const entries = await this.prisma.leaderboardDaily.findMany({
      where: { date },
      orderBy: { pnl: 'desc' },
    });

    // Update ranks
    for (let i = 0; i < entries.length; i++) {
      await this.prisma.leaderboardDaily.update({
        where: { id: entries[i].id },
        data: { rank: i + 1 },
      });
    }
  }

  /**
   * Get user's leaderboard position
   */
  async getUserLeaderboardPosition(userId: string, date?: Date) {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    const entry = await this.prisma.leaderboardDaily.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            handle: true,
          },
        },
      },
    });

    if (!entry) {
      return null;
    }

    return {
      rank: entry.rank || 0,
      userId: entry.userId,
      handle: entry.user.handle,
      pnl: fromSmallestUnits(entry.pnl, 'USDC'),
      currency: 'USDC' as const,
    };
  }

  /**
   * Get leaderboard history for a user
   */
  async getUserLeaderboardHistory(userId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const entries = await this.prisma.leaderboardDaily.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { date: 'desc' },
    });

    return entries.map(entry => ({
      date: entry.date,
      rank: entry.rank || 0,
      pnl: fromSmallestUnits(entry.pnl, 'USDC'),
      currency: 'USDC' as const,
    }));
  }
}
