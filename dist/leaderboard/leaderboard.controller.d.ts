import { LeaderboardService } from './leaderboard.service';
export declare class LeaderboardController {
    private leaderboardService;
    constructor(leaderboardService: LeaderboardService);
    getDailyLeaderboard(date?: string, limit?: number): Promise<{
        rank: number;
        userId: string;
        handle: string;
        pnl: string;
        currency: "USDC";
    }[]>;
    getUserPosition(req: {
        user: {
            sub: string;
        };
    }, date?: string): Promise<{
        rank: number;
        userId: string;
        handle: string;
        pnl: string;
        currency: "USDC";
    }>;
    getUserHistory(req: {
        user: {
            sub: string;
        };
    }, days?: number): Promise<{
        date: Date;
        rank: number;
        pnl: string;
        currency: "USDC";
    }[]>;
}
