import { PrismaService } from '../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { FairnessService } from '../fairness/fairness.service';
import { GamesService } from '../games/games.service';
import { BetPreview, BetPlaceRequest } from '../shared/types';
import { Currency, Game } from '../shared/constants';
import { BetFiltersDto } from './dto/bet-filters.dto';
export declare class BetsService {
    private prisma;
    private walletsService;
    private fairnessService;
    private gamesService;
    constructor(prisma: PrismaService, walletsService: WalletsService, fairnessService: FairnessService, gamesService: GamesService);
    previewBet(request: BetPlaceRequest): Promise<BetPreview>;
    placeBet(userId: string, request: BetPlaceRequest): Promise<{
        id: string;
        game: Game;
        currency: Currency;
        stake: string;
        potentialPayout: string;
        clientSeed: string;
        serverSeedHash: string;
        nonce: number;
        status: string;
    }>;
    resolveBet(betId: string, resolveParams?: any): Promise<{
        id: string;
        game: Game;
        currency: Currency;
        stake: string;
        outcome: any;
        resultMultiplier: any;
        payout: string;
        status: string;
        rngTrace: import("@prisma/client/runtime/library").JsonValue;
    }>;
    cashoutBet(betId: string, cashoutMultiplier?: number): Promise<{
        id: string;
        game: Game;
        currency: Currency;
        stake: string;
        outcome: string;
        resultMultiplier: number;
        payout: string;
        status: string;
    }>;
    getBet(betId: string): Promise<{
        id: string;
        game: Game;
        currency: Currency;
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
    getUserBets(userId: string, limit?: number, offset?: number): Promise<{
        bets: {
            id: string;
            game: Game;
            currency: Currency;
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
    getUserBetsWithFilters(userId: string, filters: BetFiltersDto): Promise<{
        bets: {
            id: string;
            game: Game;
            currency: Currency;
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
    private generatePumpOrDumpOutcome;
    private generateGameOutcome;
    getLiveWins(limit?: number): Promise<{
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
    private formatGameName;
    private getGameSlug;
}
