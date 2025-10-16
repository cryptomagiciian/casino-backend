import { GamesService } from './games.service';
import { Game } from '../shared/constants';
import { GameSearchQueryDto } from './dto/game-search.dto';
export declare class BetPreviewDto {
    game: Game;
    currency: string;
    stake: string;
    params?: any;
}
export declare class GamesController {
    private gamesService;
    constructor(gamesService: GamesService);
    searchGames(query: GameSearchQueryDto): Promise<{
        results: {
            slug: string;
            name: "Candle Flip" | "Pump or Dump" | "Support or Resistance" | "Bull vs Bear Battle" | "Leverage Ladder" | "Stop Loss Roulette" | "Freeze the Bag" | "To the Moon" | "Diamond Hands";
            type: string;
            description: "Predict the next candle color" | "Predict if price goes up or down" | "Predict if price breaks or rejects level" | "Tug-of-war bar direction" | "Press to advance rungs with increasing multipliers" | "Set stop loss distance for dynamic payout" | "Click to cash before crash" | "Classic crash game" | "Mines replica with 5x5 grid";
            minBet: string;
            maxBet: string;
        }[];
    }>;
    getGames(): Promise<{
        id: string;
        name: "Candle Flip" | "Pump or Dump" | "Support or Resistance" | "Bull vs Bear Battle" | "Leverage Ladder" | "Stop Loss Roulette" | "Freeze the Bag" | "To the Moon" | "Diamond Hands";
        description: "Predict the next candle color" | "Predict if price goes up or down" | "Predict if price breaks or rejects level" | "Tug-of-war bar direction" | "Press to advance rungs with increasing multipliers" | "Set stop loss distance for dynamic payout" | "Click to cash before crash" | "Classic crash game" | "Mines replica with 5x5 grid";
        houseEdge: number;
        rtp: number;
    }[]>;
    getGameConfig(game: Game): Promise<{
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "Candle Flip";
        description: "Predict the next candle color";
        winChance: 0.495;
        multiplier: 1.98;
    } | {
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "Pump or Dump";
        description: "Predict if price goes up or down";
        winChance: 0.495;
        multiplier: 1.98;
    } | {
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "Support or Resistance";
        description: "Predict if price breaks or rejects level";
        winChance: 0.485;
        multiplier: 2.02;
    } | {
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "Bull vs Bear Battle";
        description: "Tug-of-war bar direction";
        winChance: 0.49;
        multiplier: 2;
    } | {
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "Leverage Ladder";
        description: "Press to advance rungs with increasing multipliers";
        multipliers: readonly [1.3, 1.69, 2.19, 2.85, 3.7, 4.8];
    } | {
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "Stop Loss Roulette";
        description: "Set stop loss distance for dynamic payout";
        maxMultiplier: 4;
    } | {
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "Freeze the Bag";
        description: "Click to cash before crash";
        crashProbability: 0.01;
    } | {
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "To the Moon";
        description: "Classic crash game";
        crashProbability: 0.01;
    } | {
        houseEdgeBps: number;
        params: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
        name: "Diamond Hands";
        description: "Mines replica with 5x5 grid";
        gridSize: 25;
        defaultMines: 3;
    }>;
}
