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
  async getWalletBalances() {
    return this.request('/wallets');
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

  async getUserBets(limit = 50, offset = 0) {
    return this.request(`/bets?limit=${limit}&offset=${offset}`);
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
}

export const apiService = new ApiService(API_BASE_URL);
