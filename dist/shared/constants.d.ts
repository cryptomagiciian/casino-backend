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
    readonly WITHDRAWAL_LOCK: "WITHDRAWAL_LOCK";
    readonly WITHDRAWAL_UNLOCK: "WITHDRAWAL_UNLOCK";
    readonly BET_STAKE: "BET_STAKE";
    readonly BET_WIN: "BET_WIN";
    readonly BET_REFUND: "BET_REFUND";
    readonly FAUCET: "FAUCET";
    readonly TRANSFER: "TRANSFER";
    readonly FUTURES_OPEN_FEE: "FUTURES_OPEN_FEE";
    readonly FUTURES_CLOSE_FEE: "FUTURES_CLOSE_FEE";
    readonly FUTURES_IMPACT_FEE: "FUTURES_IMPACT_FEE";
    readonly FUTURES_BORROW_FEE: "FUTURES_BORROW_FEE";
    readonly FUTURES_FUNDING: "FUTURES_FUNDING";
    readonly FUTURES_LIQUIDATION_FEE: "FUTURES_LIQUIDATION_FEE";
    readonly FUTURES_PNL_WIN: "FUTURES_PNL_WIN";
    readonly FUTURES_PNL_LOSS: "FUTURES_PNL_LOSS";
    readonly FUTURES_LIQUIDATION_LOSS: "FUTURES_LIQUIDATION_LOSS";
};
export type LedgerType = typeof LEDGER_TYPES[keyof typeof LEDGER_TYPES];
export declare const DEFAULT_HOUSE_EDGE_BPS = 200;
export declare const TESTNET_FAUCET_AMOUNTS: {
    readonly BTC: 0.001;
    readonly ETH: 0.01;
    readonly SOL: 0.1;
    readonly USDC: 10;
    readonly USDT: 10;
};
