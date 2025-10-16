import { BetsService } from './bets.service';
import { BetPreview } from '../shared/types';
import { LiveWinsQueryDto } from './dto/live-wins.dto';
import { BetFiltersDto } from './dto/bet-filters.dto';
export declare class BetPreviewDto {
    game: string;
    currency: string;
    stake: string;
    params?: any;
}
export declare class BetPlaceDto {
    game: string;
    currency: string;
    stake: string;
    clientSeed?: string;
    params?: any;
}
export declare class BetsController {
    private betsService;
    constructor(betsService: BetsService);
    previewBet(previewDto: BetPreviewDto): Promise<BetPreview>;
    placeBet(req: {
        user: {
            id: string;
        };
    }, placeDto: BetPlaceDto): Promise<{
        id: string;
        game: import("../shared/constants").Game;
        currency: import("../shared/constants").Currency;
        stake: string;
        potentialPayout: string;
        clientSeed: string;
        serverSeedHash: string;
        nonce: number;
        status: string;
    }>;
    resolveBet(betId: string, resolveParams?: any): Promise<{
        id: string;
        game: import("../shared/constants").Game;
        currency: import("../shared/constants").Currency;
        stake: string;
        outcome: any;
        resultMultiplier: any;
        payout: string;
        status: string;
        rngTrace: import("@prisma/client/runtime/library").JsonValue;
    }>;
    cashoutBet(betId: string, body?: {
        multiplier?: number;
    }): Promise<{
        id: string;
        game: import("../shared/constants").Game;
        currency: import("../shared/constants").Currency;
        stake: string;
        outcome: string;
        resultMultiplier: number;
        payout: string;
        status: string;
    }>;
    getBet(betId: string): Promise<{
        id: string;
        game: import("../shared/constants").Game;
        currency: import("../shared/constants").Currency;
        stake: string;
        potentialPayout: string;
        outcome: string;
        resultMultiplier: number;
        status: import(".prisma/client").$Enums.BetStatus;
        serverSeedHash: string;
        clientSeed: string;
        nonce: number;
        revealedServerSeed: string;
        rngTrace: import("@prisma/client/runtime/library").JsonValue;
        params: import("@prisma/client/runtime/library").JsonValue;
        createdAt: Date;
        resolvedAt: Date;
    }>;
    getUserBets(req: {
        user: {
            id: string;
        };
    }, filters: BetFiltersDto): Promise<{
        bets: {
            id: string;
            game: import("../shared/constants").Game;
            currency: import("../shared/constants").Currency;
            stake: string;
            potentialPayout: string;
            outcome: string;
            resultMultiplier: number;
            status: import(".prisma/client").$Enums.BetStatus;
            createdAt: Date;
            resolvedAt: Date;
        }[];
        total: number;
    }>;
    getLiveWins(query: LiveWinsQueryDto): Promise<{
        wins: {
            id: string;
            username: string;
            game: string;
            gameSlug: string;
            amount: string;
            multiplier: number;
            payout: string;
            currency: string;
            timestamp: string;
        }[];
    }>;
}
