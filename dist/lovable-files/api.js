"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiService = void 0;
const API_BASE_URL = 'http://localhost:3000/api/v1';
class ApiService {
    constructor(baseURL) {
        this.token = null;
        this.baseURL = baseURL;
        this.token = localStorage.getItem('accessToken');
    }
    setToken(token) {
        this.token = token;
        localStorage.setItem('accessToken', token);
    }
    clearToken() {
        this.token = null;
        localStorage.removeItem('accessToken');
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` }),
                ...options.headers,
            },
            ...options,
        };
        const response = await fetch(url, config);
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Network error' }));
            throw new Error(error.message || `API Error: ${response.status}`);
        }
        return response.json();
    }
    async register(data) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async login(data) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async getProfile() {
        return this.request('/auth/me');
    }
    async getWalletBalances() {
        return this.request('/wallets');
    }
    async faucet(currency, amount) {
        return this.request('/wallets/faucet', {
            method: 'POST',
            body: JSON.stringify({ currency, amount }),
        });
    }
    async getGames() {
        return this.request('/games');
    }
    async previewBet(data) {
        return this.request('/bets/preview', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async placeBet(data) {
        return this.request('/bets/place', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async resolveBet(betId) {
        return this.request(`/bets/resolve/${betId}`, {
            method: 'POST',
        });
    }
    async getUserBets(limit = 50, offset = 0) {
        return this.request(`/bets?limit=${limit}&offset=${offset}`);
    }
    async getCurrentSeed() {
        return this.request('/fairness/seed/current');
    }
    async verifyFairness(data) {
        return this.request('/fairness/verify', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
}
exports.apiService = new ApiService(API_BASE_URL);
//# sourceMappingURL=api.js.map