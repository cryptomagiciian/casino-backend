export declare const CURRENCIES: {
    readonly BTC: "BTC";
    readonly ETH: "ETH";
    readonly SOL: "SOL";
    readonly USDC: "USDC";
    readonly USDT: "USDT";
};
export type Currency = typeof CURRENCIES[keyof typeof CURRENCIES];
export declare const CURRENCY_DECIMALS: {
    readonly BTC: 8;
    readonly ETH: 18;
    readonly SOL: 9;
    readonly USDC: 6;
    readonly USDT: 6;
};
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
export declare const GAME_CONFIGS: {
    readonly candle_flip: {
        readonly name: "Candle Flip";
        readonly description: "Predict the next candle color";
        readonly houseEdgeBps: 100;
        readonly winChance: 0.495;
        readonly multiplier: 1.98;
    };
    readonly pump_or_dump: {
        readonly name: "Pump or Dump";
        readonly description: "Predict if price goes up or down";
        readonly houseEdgeBps: 100;
        readonly winChance: 0.495;
        readonly multiplier: 1.98;
    };
    readonly support_or_resistance: {
        readonly name: "Support or Resistance";
        readonly description: "Predict if price breaks or rejects level";
        readonly houseEdgeBps: 300;
        readonly winChance: 0.485;
        readonly multiplier: 2.02;
    };
    readonly bull_vs_bear_battle: {
        readonly name: "Bull vs Bear Battle";
        readonly description: "Tug-of-war bar direction";
        readonly houseEdgeBps: 200;
        readonly winChance: 0.49;
        readonly multiplier: 2;
    };
    readonly leverage_ladder: {
        readonly name: "Leverage Ladder";
        readonly description: "Press to advance rungs with increasing multipliers";
        readonly houseEdgeBps: 200;
        readonly multipliers: readonly [1.3, 1.69, 2.19, 2.85, 3.7, 4.8];
    };
    readonly stop_loss_roulette: {
        readonly name: "Stop Loss Roulette";
        readonly description: "Set stop loss distance for dynamic payout";
        readonly houseEdgeBps: 200;
        readonly maxMultiplier: 4;
    };
    readonly freeze_the_bag: {
        readonly name: "Freeze the Bag";
        readonly description: "Click to cash before crash";
        readonly houseEdgeBps: 200;
        readonly crashProbability: 0.01;
    };
    readonly to_the_moon: {
        readonly name: "To the Moon";
        readonly description: "Classic crash game";
        readonly houseEdgeBps: 200;
        readonly crashProbability: 0.01;
    };
    readonly diamond_hands: {
        readonly name: "Diamond Hands";
        readonly description: "Mines replica with 5x5 grid";
        readonly houseEdgeBps: 200;
        readonly gridSize: 25;
        readonly defaultMines: 3;
    };
};
export declare const LEDGER_TYPES: {
    readonly DEPOSIT: "DEPOSIT";
    readonly WITHDRAWAL: "WITHDRAWAL";
    readonly BET_STAKE: "BET_STAKE";
    readonly BET_WIN: "BET_WIN";
    readonly BET_REFUND: "BET_REFUND";
    readonly FAUCET: "FAUCET";
    readonly TRANSFER: "TRANSFER";
};
export type LedgerType = typeof LEDGER_TYPES[keyof typeof LEDGER_TYPES];
export declare const DEFAULT_HOUSE_EDGE_BPS = 200;
export declare const FAUCET_DAILY_LIMITS: {
    readonly BTC: 1000000;
    readonly ETH: 10000000000000000000n;
    readonly SOL: 10000000000;
    readonly USDC: 100000000000;
    readonly USDT: 100000000000;
};
