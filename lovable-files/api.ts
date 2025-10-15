const API_BASE_URL = 'https://dexinocasino.com/api/v1';
const API_VERSION = 'v-realtime-trading-optimized'; // Real-time trading optimizations

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
    console.log(`🚀 API Service initialized with version: ${API_VERSION}`);
    console.log(`🚀 Cache bust timestamp: ${Date.now()}`);
    console.log(`🔑 Token loaded: ${this.token ? 'Yes' : 'No'}`);
    console.log(`🔑 Token preview: ${this.token ? this.token.substring(0, 20) + '...' : 'None'}`);
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
  }

  refreshTokenFromStorage() {
    this.token = localStorage.getItem('accessToken');
    console.log(`🔄 Token refreshed from storage: ${this.token ? 'Yes' : 'No'}`);
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    console.log('API Request:', options.method || 'GET', endpoint);

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Network error',
        statusCode: response.status 
      }));
      
      console.error('API Error:', response.status, error);
      
      // Handle 401 Unauthorized - token expired
      if (response.status === 401) {
        console.warn('Token expired or invalid - logging out');
        this.clearToken();
        // Only redirect to login if this is NOT the profile check during initialization
        if (endpoint !== '/auth/me') {
          window.location.href = '/'; // Redirect to login
        }
        throw new Error('Session expired. Please login again.');
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    console.log('API Response:', options.method || 'GET', endpoint, 'OK');
    return response.json();
  }

  // Auth endpoints
  async register(data: { handle: string; email: string; password: string }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: { handle: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  // Wallet endpoints
  async getWalletBalances(detailed = false) {
    // Default to mainnet for live mode
    const params = new URLSearchParams();
    if (detailed) params.append('detailed', 'true');
    params.append('network', 'mainnet');
    const endpoint = `/wallets?${params.toString()}`;
    console.log('🧪 API DEBUG: getWalletBalances called (mainnet)');
    return this.request(endpoint);
  }

  // Alternative method to force testnet balances
  async getTestnetBalances(detailed = false) {
    const params = new URLSearchParams();
    if (detailed) params.append('detailed', 'true');
    params.append('network', 'testnet');
    const endpoint = `/wallets?${params.toString()}`;
    console.log('🧪 API DEBUG: getTestnetBalances - forcing testnet network');
    return this.request(endpoint);
  }

  // Emergency method - completely bypass all logic
  async getBalancesEmergency() {
    console.log('🚨 EMERGENCY: Using direct testnet fetch');
    const params = new URLSearchParams();
    params.append('network', 'testnet');
    const endpoint = `/wallets?${params.toString()}`;
    return this.request(endpoint);
  }

  async faucet(currency: string) {
    return this.request('/wallets/faucet', {
      method: 'POST',
      body: JSON.stringify({ currency }),
    });
  }

  async clearDemoFunds() {
    return this.request('/wallets/clear-demo-funds', {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    });
  }

  // Games endpoints
  async getGames() {
    return this.request('/games');
  }

  async searchGames(query: string, limit = 10) {
    return this.request(`/games/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  async previewBet(data: any) {
    return this.request('/bets/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async placeBet(data: any) {
    return this.request('/bets/place', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resolveBet(betId: string, resolveParams?: any) {
    return this.request(`/bets/resolve/${betId}`, {
      method: 'POST',
      body: resolveParams ? JSON.stringify(resolveParams) : undefined,
    });
  }

  async cashoutBet(betId: string, multiplier?: number) {
    return this.request(`/bets/cashout/${betId}`, {
      method: 'POST',
      body: JSON.stringify({ multiplier }),
    });
  }

  async getUserBets(filters: {
    game?: string;
    status?: 'won' | 'lost' | 'pending';
    currency?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const params = new URLSearchParams();
    
    if (filters.game) params.append('game', filters.game);
    if (filters.status) params.append('status', filters.status);
    if (filters.currency) params.append('currency', filters.currency);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    
    const queryString = params.toString();
    const endpoint = queryString ? `/bets?${queryString}` : '/bets';
    return this.request(endpoint);
  }

  async getLiveWins(limit = 20) {
    return this.request(`/bets/live-wins?limit=${limit}`);
  }

  // Fairness endpoints
  async getCurrentSeed() {
    return this.request('/fairness/seed/current');
  }

  async verifyFairness(data: any) {
    return this.request('/fairness/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Prices endpoints
  async getCryptoPrices() {
    return this.request('/prices/crypto');
  }

  // getCandlestickData removed - now using TradingView charts

  // Web3 Deposit endpoints
  async createDeposit(data: {
    currency: string;
    amount: number;
    network: 'mainnet' | 'testnet';
    blockchain?: string; // For multi-chain tokens like USDC/USDT
    transactionHash?: string;
    blockNumber?: number;
  }) {
    return this.request('/deposits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDeposits(limit = 50, offset = 0) {
    return this.request(`/deposits?limit=${limit}&offset=${offset}`);
  }

  async getDeposit(depositId: string) {
    return this.request(`/deposits/${depositId}`);
  }

  async getDepositLimits(currency: string) {
    return this.request(`/deposits/limits/${currency}`);
  }

  async confirmDeposit(depositId: string) {
    return this.request(`/deposits/${depositId}/confirm`, {
      method: 'POST',
    });
  }

  // Web3 Withdrawal endpoints
  async createWithdrawal(data: {
    currency: string;
    amount: number;
    walletAddress: string;
    network: 'mainnet' | 'testnet';
    blockchain?: string; // For multi-chain tokens like USDC/USDT
    twoFactorCode?: string;
    withdrawalPassword?: string;
  }) {
    return this.request('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getWithdrawals(limit = 50, offset = 0) {
    return this.request(`/withdrawals?limit=${limit}&offset=${offset}`);
  }

  async getWithdrawal(withdrawalId: string) {
    return this.request(`/withdrawals/${withdrawalId}`);
  }

  async cancelWithdrawal(withdrawalId: string) {
    return this.request(`/withdrawals/${withdrawalId}`, {
      method: 'DELETE',
    });
  }

  async getWithdrawalLimits(currency: string) {
    return this.request(`/withdrawals/limits/${currency}`);
  }

  // Futures Trading endpoints
  async getFuturesSymbols() {
    return this.request('/futures/symbols');
  }

  async getCurrentTradingRound() {
    return this.request('/futures/round/current');
  }

  async openFuturesPosition(orderData: {
    symbolId: string;
    side: 'LONG' | 'SHORT';
    leverage: number;
    collateral: number;
    qty?: number;
    splitSize?: number;
  }) {
    return this.request('/futures/order/open', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async closeFuturesPosition(positionId: string, qty?: number) {
    return this.request('/futures/order/close', {
      method: 'POST',
      body: JSON.stringify({ positionId, qty }),
    });
  }

  async getFuturesPositions(status?: 'OPEN' | 'CLOSED' | 'LIQUIDATED', page = 1, limit = 20) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    return this.request(`/futures/positions?${params.toString()}`);
  }

  async getFuturesPosition(positionId: string) {
    return this.request(`/futures/positions/${positionId}`);
  }

  async getLiquidationPrice(positionId: string) {
    return this.request(`/futures/positions/${positionId}/liquidation-price`);
  }

  async getFundingRate(symbolId: string) {
    return this.request(`/futures/funding-rate/${symbolId}`);
  }

  async getBorrowRate(symbolId: string) {
    return this.request(`/futures/borrow-rate/${symbolId}`);
  }

  async getMaintenanceMarginRate(leverage: number) {
    return this.request(`/futures/maintenance-margin-rate/${leverage}`);
  }

  // Admin seeding endpoints
  async seedFuturesSymbols() {
    return this.request('/futures/seed/symbols', {
      method: 'POST',
    });
  }

  async createInitialTradingRound() {
    return this.request('/futures/seed/round', {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
