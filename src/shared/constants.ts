// Currency constants
export const CURRENCIES = {
  BTC: 'BTC',
  ETH: 'ETH',
  SOL: 'SOL',
  USDC: 'USDC',
  USDT: 'USDT',
} as const;

export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];

// Currency decimals (smallest unit)
export const CURRENCY_DECIMALS = {
  [CURRENCIES.BTC]: 8,
  [CURRENCIES.ETH]: 18,
  [CURRENCIES.SOL]: 9,
  [CURRENCIES.USDC]: 6,
  [CURRENCIES.USDT]: 6,
} as const;

// Game identifiers
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

// Game configurations
export const GAME_CONFIGS = {
  [GAMES.CANDLE_FLIP]: {
    name: 'Candle Flip',
    description: 'Predict the next candle color',
    houseEdgeBps: 100, // 1%
    winChance: 0.495, // 49.5%
    multiplier: 1.98,
  },
  [GAMES.PUMP_OR_DUMP]: {
    name: 'Pump or Dump',
    description: 'Predict if price goes up or down',
    houseEdgeBps: 100,
    winChance: 0.495,
    multiplier: 1.98,
  },
  [GAMES.SUPPORT_OR_RESISTANCE]: {
    name: 'Support or Resistance',
    description: 'Predict if price breaks or rejects level',
    houseEdgeBps: 300, // 3%
    winChance: 0.485,
    multiplier: 2.02,
  },
  [GAMES.BULL_VS_BEAR_BATTLE]: {
    name: 'Bull vs Bear Battle',
    description: 'Tug-of-war bar direction',
    houseEdgeBps: 200, // 2%
    winChance: 0.49,
    multiplier: 2.0,
  },
  [GAMES.LEVERAGE_LADDER]: {
    name: 'Leverage Ladder',
    description: 'Press to advance rungs with increasing multipliers',
    houseEdgeBps: 200,
    multipliers: [1.3, 1.69, 2.19, 2.85, 3.7, 4.8],
  },
  [GAMES.STOP_LOSS_ROULETTE]: {
    name: 'Stop Loss Roulette',
    description: 'Set stop loss distance for dynamic payout',
    houseEdgeBps: 200,
    maxMultiplier: 4.0,
  },
  [GAMES.FREEZE_THE_BAG]: {
    name: 'Freeze the Bag',
    description: 'Click to cash before crash',
    houseEdgeBps: 200,
    crashProbability: 0.01, // 1% chance to crash each step
  },
  [GAMES.TO_THE_MOON]: {
    name: 'To the Moon',
    description: 'Classic crash game',
    houseEdgeBps: 200,
    crashProbability: 0.01,
  },
  [GAMES.DIAMOND_HANDS]: {
    name: 'Diamond Hands',
    description: 'Mines replica with 5x5 grid',
    houseEdgeBps: 200,
    gridSize: 25,
    defaultMines: 3,
  },
} as const;

// Ledger entry types
export const LEDGER_TYPES = {
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  BET_STAKE: 'BET_STAKE',
  BET_WIN: 'BET_WIN',
  BET_REFUND: 'BET_REFUND',
  FAUCET: 'FAUCET',
  TRANSFER: 'TRANSFER',
} as const;

export type LedgerType = typeof LEDGER_TYPES[keyof typeof LEDGER_TYPES];

// Default house edge in basis points (200 = 2%)
export const DEFAULT_HOUSE_EDGE_BPS = 200;

// Faucet daily limits (in smallest currency units)
// Increased for testing - users can get lots of demo funds!
export const FAUCET_DAILY_LIMITS = {
  [CURRENCIES.BTC]: 1000000, // 0.01 BTC
  [CURRENCIES.ETH]: 10000000000000000000n, // 10 ETH
  [CURRENCIES.SOL]: 10000000000, // 10 SOL
  [CURRENCIES.USDC]: 100000000000, // 100,000 USDC (100K per day!)
  [CURRENCIES.USDT]: 100000000000, // 100,000 USDT
} as const;
