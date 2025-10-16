import { Currency, Game } from './constants';
export interface UserPayload {
    sub: string;
    handle: string;
    email?: string;
    iat?: number;
    exp?: number;
}
export interface WalletBalance {
    currency: Currency;
    available: string;
    locked: string;
    total: string;
}
export interface BetPreview {
    game: Game;
    currency: Currency;
    stake: string;
    potentialPayout: string;
    winChance: number;
    multiplier: number;
    houseEdge: number;
}
export interface BetPlaceRequest {
    game: Game;
    currency: Currency;
    stake: string;
    clientSeed?: string;
    params?: Record<string, any>;
}
export interface BetResult {
    id: string;
    game: Game;
    currency: Currency;
    stake: string;
    outcome: string;
    resultMultiplier: number;
    payout: string;
    status: 'WON' | 'LOST' | 'CASHED_OUT';
    rngTrace: any;
}
export interface FairnessSeed {
    serverSeedHash: string;
    nonce: number;
}
export interface FairnessVerifyRequest {
    serverSeed: string;
    clientSeed: string;
    nonce: number;
    game: Game;
    betId?: string;
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
export interface FreezeTheBagParams {
}
export interface ToTheMoonParams {
}
export interface DiamondHandsParams {
    mines: number;
    picks: number[];
}
export interface DepositRequest {
    currency: Currency;
    amount: string;
    network: 'mainnet' | 'testnet';
    transactionHash?: string;
    blockNumber?: number;
}
export interface WithdrawalRequest {
    currency: Currency;
    amount: string;
    walletAddress: string;
    network: 'mainnet' | 'testnet';
    twoFactorCode?: string;
    withdrawalPassword?: string;
}
export interface DepositResponse {
    id: string;
    currency: Currency;
    amount: string;
    network: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    walletAddress: string;
    transactionHash?: string;
    blockNumber?: number;
    qrCodeData: string;
    requiredConfirmations: number;
    currentConfirmations: number;
    explorerUrl: string;
    createdAt: string;
    completedAt?: string;
}
export interface WithdrawalResponse {
    id: string;
    currency: Currency;
    amount: string;
    fee: string;
    netAmount: string;
    walletAddress: string;
    network: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    transactionHash?: string;
    blockNumber?: number;
    processingTime: string;
    explorerUrl?: string;
    createdAt: string;
    completedAt?: string;
}
export interface LeaderboardEntry {
    rank: number;
    userId: string;
    handle: string;
    pnl: string;
    currency: Currency;
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
