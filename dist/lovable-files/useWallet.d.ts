export declare const useWallet: () => {
    balances: any;
    loading: any;
    fetchBalances: () => Promise<void>;
    faucet: (currency: string, amount: string) => Promise<void>;
};
