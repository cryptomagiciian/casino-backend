import { PrismaService } from '../prisma/prisma.service';
export declare class LeaderboardService {
    private prisma;
    constructor(prisma: PrismaService);
    getDailyLeaderboard(date?: Date, limit?: number): Promise<{
        rank: number;
        userId: string;
        handle: string;
        pnl: string;
        currency: "USDC";
    }[]>;
    updateDailyPnL(userId: string, pnl: bigint, currency: string, date?: Date): Promise<{
        id: string;
        userId: string;
        pnl: bigint;
        date: Date;
        rank: number | null;
    }>;
    private updateDailyRanks;
    getUserLeaderboardPosition(userId: string, date?: Date): Promise<{
        rank: number;
        userId: string;
        handle: string;
        pnl: string;
        currency: "USDC";
    }>;
    getUserLeaderboardHistory(userId: string, days?: number): Promise<{
        date: Date;
        rank: number;
        pnl: string;
        currency: "USDC";
    }[]>;
}
