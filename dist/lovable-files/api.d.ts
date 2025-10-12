declare class ApiService {
    private baseURL;
    private token;
    constructor(baseURL: string);
    setToken(token: string): void;
    clearToken(): void;
    private request;
    register(data: {
        handle: string;
        email: string;
        password: string;
    }): Promise<unknown>;
    login(data: {
        handle: string;
        password: string;
    }): Promise<unknown>;
    getProfile(): Promise<unknown>;
    getWalletBalances(): Promise<unknown>;
    faucet(currency: string, amount: string): Promise<unknown>;
    getGames(): Promise<unknown>;
    previewBet(data: any): Promise<unknown>;
    placeBet(data: any): Promise<unknown>;
    resolveBet(betId: string): Promise<unknown>;
    getUserBets(limit?: number, offset?: number): Promise<unknown>;
    getCurrentSeed(): Promise<unknown>;
    verifyFairness(data: any): Promise<unknown>;
}
export declare const apiService: ApiService;
export {};
