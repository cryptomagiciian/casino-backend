"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAUCET_DAILY_LIMITS = exports.DEFAULT_HOUSE_EDGE_BPS = exports.LEDGER_TYPES = exports.GAME_CONFIGS = exports.GAMES = exports.CURRENCY_DECIMALS = exports.CURRENCIES = void 0;
exports.CURRENCIES = {
    BTC: 'BTC',
    ETH: 'ETH',
    SOL: 'SOL',
    USDC: 'USDC',
    USDT: 'USDT',
};
exports.CURRENCY_DECIMALS = {
    [exports.CURRENCIES.BTC]: 8,
    [exports.CURRENCIES.ETH]: 18,
    [exports.CURRENCIES.SOL]: 9,
    [exports.CURRENCIES.USDC]: 6,
    [exports.CURRENCIES.USDT]: 6,
};
exports.GAMES = {
    CANDLE_FLIP: 'candle_flip',
    PUMP_OR_DUMP: 'pump_or_dump',
    SUPPORT_OR_RESISTANCE: 'support_or_resistance',
    BULL_VS_BEAR_BATTLE: 'bull_vs_bear_battle',
    LEVERAGE_LADDER: 'leverage_ladder',
    STOP_LOSS_ROULETTE: 'stop_loss_roulette',
    FREEZE_THE_BAG: 'freeze_the_bag',
    TO_THE_MOON: 'to_the_moon',
    DIAMOND_HANDS: 'diamond_hands',
};
exports.GAME_CONFIGS = {
    [exports.GAMES.CANDLE_FLIP]: {
        name: 'Candle Flip',
        description: 'Predict the next candle color',
        houseEdgeBps: 100,
        winChance: 0.495,
        multiplier: 1.98,
    },
    [exports.GAMES.PUMP_OR_DUMP]: {
        name: 'Pump or Dump',
        description: 'Predict if price goes up or down',
        houseEdgeBps: 100,
        winChance: 0.495,
        multiplier: 1.98,
    },
    [exports.GAMES.SUPPORT_OR_RESISTANCE]: {
        name: 'Support or Resistance',
        description: 'Predict if price breaks or rejects level',
        houseEdgeBps: 300,
        winChance: 0.485,
        multiplier: 2.02,
    },
    [exports.GAMES.BULL_VS_BEAR_BATTLE]: {
        name: 'Bull vs Bear Battle',
        description: 'Tug-of-war bar direction',
        houseEdgeBps: 200,
        winChance: 0.49,
        multiplier: 2.0,
    },
    [exports.GAMES.LEVERAGE_LADDER]: {
        name: 'Leverage Ladder',
        description: 'Press to advance rungs with increasing multipliers',
        houseEdgeBps: 200,
        multipliers: [1.3, 1.69, 2.19, 2.85, 3.7, 4.8],
    },
    [exports.GAMES.STOP_LOSS_ROULETTE]: {
        name: 'Stop Loss Roulette',
        description: 'Set stop loss distance for dynamic payout',
        houseEdgeBps: 200,
        maxMultiplier: 4.0,
    },
    [exports.GAMES.FREEZE_THE_BAG]: {
        name: 'Freeze the Bag',
        description: 'Click to cash before crash',
        houseEdgeBps: 200,
        crashProbability: 0.01,
    },
    [exports.GAMES.TO_THE_MOON]: {
        name: 'To the Moon',
        description: 'Classic crash game',
        houseEdgeBps: 200,
        crashProbability: 0.01,
    },
    [exports.GAMES.DIAMOND_HANDS]: {
        name: 'Diamond Hands',
        description: 'Mines replica with 5x5 grid',
        houseEdgeBps: 200,
        gridSize: 25,
        defaultMines: 3,
    },
};
exports.LEDGER_TYPES = {
    DEPOSIT: 'DEPOSIT',
    WITHDRAWAL: 'WITHDRAWAL',
    BET_STAKE: 'BET_STAKE',
    BET_WIN: 'BET_WIN',
    BET_REFUND: 'BET_REFUND',
    FAUCET: 'FAUCET',
    TRANSFER: 'TRANSFER',
};
exports.DEFAULT_HOUSE_EDGE_BPS = 200;
exports.FAUCET_DAILY_LIMITS = {
    [exports.CURRENCIES.BTC]: 100000,
    [exports.CURRENCIES.ETH]: 1000000000000000000,
    [exports.CURRENCIES.SOL]: 1000000000,
    [exports.CURRENCIES.USDC]: 1000000000,
    [exports.CURRENCIES.USDT]: 1000000000,
};
//# sourceMappingURL=constants.js.map