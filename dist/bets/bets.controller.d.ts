import { BetsService } from './bets.service';
import { BetPreview } from '../shared/types';
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
            sub: string;
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
    resolveBet(betId: string): Promise<{
        id: string;
        game: import("../shared/constants").Game;
        currency: import("../shared/constants").Currency;
        stake: string;
        outcome: string;
        resultMultiplier: number;
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
            sub: string;
        };
    }, limit?: number, offset?: number): Promise<{
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
}
