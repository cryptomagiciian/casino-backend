export interface User {
    id: string;
    handle: string;
    email?: string;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}
export interface WalletBalance {
    currency: string;
    available: string;
    locked: string;
    total: string;
}
export interface Game {
    id: string;
    name: string;
    description: string;
    houseEdge: number;
    rtp: number;
}
export interface BetPreview {
    game: string;
    currency: string;
    stake: string;
    potentialPayout: string;
    winChance: number;
    multiplier: number;
    houseEdge: number;
}
export interface Bet {
    id: string;
    game: string;
    currency: string;
    stake: string;
    potentialPayout: string;
    outcome?: string;
    resultMultiplier?: number;
    status: 'PENDING' | 'WON' | 'LOST' | 'CASHED_OUT';
    clientSeed: string;
    serverSeedHash: string;
    nonce: number;
    createdAt: string;
    resolvedAt?: string;
}
export interface FairnessSeed {
    serverSeedHash: string;
    nonce: number;
}
export interface FairnessVerifyResult {
    valid: boolean;
    outcome?: string;
    multiplier?: number;
    rngTrace?: any;
    error?: string;
}
export interface CandleFlipParams {
    prediction: 'red' | 'green';
}
export interface PumpOrDumpParams {
    prediction: 'pump' | 'dump';
}
export interface SupportOrResistanceParams {
    prediction: 'break' | 'reject';
    level: number;
}
export interface BullVsBearParams {
    prediction: 'bull' | 'bear';
}
export interface LeverageLadderParams {
    targetRung: number;
}
export interface StopLossRouletteParams {
    stopLossDistance: number;
}
export interface DiamondHandsParams {
    mines: number;
    picks: number[];
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare const CURRENCIES: {
    readonly BTC: "BTC";
    readonly ETH: "ETH";
    readonly SOL: "SOL";
    readonly USDC: "USDC";
    readonly USDT: "USDT";
};
export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];
export declare const GAMES: {
    readonly CANDLE_FLIP: "candle_flip";
    readonly PUMP_OR_DUMP: "pump_or_dump";
    readonly SUPPORT_OR_RESISTANCE: "support_or_resistance";
    readonly BULL_VS_BEAR_BATTLE: "bull_vs_bear_battle";
    readonly LEVERAGE_LADDER: "leverage_ladder";
    readonly STOP_LOSS_ROULETTE: "stop_loss_roulette";
    readonly FREEZE_THE_BAG: "freeze_the_bag";
    readonly TO_THE_MOON: "to_the_moon";
    readonly DIAMOND_HANDS: "diamond_hands";
};
export type Game = typeof GAMES[keyof typeof GAMES];
