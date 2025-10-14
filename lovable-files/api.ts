const API_BASE_URL = 'https://casino-backend-production-8186.up.railway.app/api/v1';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('accessToken');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('accessToken', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('accessToken');
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
        window.location.href = '/'; // Redirect to login
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
    const endpoint = detailed ? '/wallets?detailed=true' : '/wallets';
    return this.request(endpoint);
  }

  async faucet(currency: string, amount: string) {
    return this.request('/wallets/faucet', {
      method: 'POST',
      body: JSON.stringify({ currency, amount }),
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

  async resolveBet(betId: string) {
    return this.request(`/bets/resolve/${betId}`, {
      method: 'POST',
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
}

export const apiService = new ApiService(API_BASE_URL);
