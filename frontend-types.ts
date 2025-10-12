// TypeScript types for the casino frontend
// Copy these to your Lovable project's types directory

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

// Game-specific parameter types
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

export interface DiamondHandsParams {
  mines: number; // number of mines (1-24)
  picks: number[]; // array of grid positions to pick
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

// Currency constants
export const CURRENCIES = {
  BTC: 'BTC',
  ETH: 'ETH',
  SOL: 'SOL',
  USDC: 'USDC',
  USDT: 'USDT',
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

// Game constants
export const GAMES = {
  CANDLE_FLIP: 'candle_flip',
  PUMP_OR_DUMP: 'pump_or_dump',
  SUPPORT_OR_RESISTANCE: 'support_or_resistance',
  BULL_VS_BEAR_BATTLE: 'bull_vs_bear_battle',
  LEVERAGE_LADDER: 'leverage_ladder',
  STOP_LOSS_ROULETTE: 'stop_loss_roulette',
  FREEZE_THE_BAG: 'freeze_the_bag',
  TO_THE_MOON: 'to_the_moon',
  DIAMOND_HANDS: 'diamond_hands',
} as const;

export type Game = typeof GAMES[keyof typeof GAMES];
