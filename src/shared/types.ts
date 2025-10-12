import { Currency, Game, LedgerType } from './constants';

// User types
export interface UserPayload {
  sub: string;
  handle: string;
  email?: string;
  iat?: number;
  exp?: number;
}

// Wallet types
export interface WalletBalance {
  currency: Currency;
  available: string;
  locked: string;
  total: string;
}

export interface FaucetRequest {
  currency: Currency;
  amount: string;
}

// Bet types
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

// Fairness types
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

// Game-specific types
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
  targetRung: number; // 0-5
}

export interface StopLossRouletteParams {
  stopLossDistance: number; // percentage
}

export interface FreezeTheBagParams {
  // No additional params needed
}

export interface ToTheMoonParams {
  // No additional params needed
}

export interface DiamondHandsParams {
  mines: number; // number of mines (1-24)
  picks: number[]; // array of grid positions to pick
}

// Deposit/Withdrawal types
export interface DepositRequest {
  currency: Currency;
  amount: string;
  provider: string;
  txRef?: string;
}

export interface WithdrawalRequest {
  currency: Currency;
  amount: string;
  address: string;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  handle: string;
  pnl: string;
  currency: Currency;
}

// API Response types
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
