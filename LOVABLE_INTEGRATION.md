# 🎰 Lovable Frontend Integration Guide

## 🚀 Quick Setup

Your casino backend is now running at: **http://localhost:3000/api/v1**

### 1. **API Base URL**
In your Lovable project, set this as your API base URL:
```
http://localhost:3000/api/v1
```

### 2. **Test the Connection**
First, test that your backend is working:
- Visit: http://localhost:3000/docs (Swagger documentation)
- Visit: http://localhost:3000/api/v1/health (Health check)

## 📁 **Lovable Project Structure**

Create these files in your Lovable project:

```
src/
├── services/
│   └── api.ts
├── hooks/
│   ├── useAuth.ts
│   └── useWallet.ts
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── games/
│   │   ├── GameList.tsx
│   │   ├── CandleFlip.tsx
│   │   └── ToTheMoon.tsx
│   ├── wallet/
│   │   ├── WalletBalance.tsx
│   │   └── FaucetButton.tsx
│   └── shared/
│       ├── Layout.tsx
│       └── Header.tsx
└── types/
    └── index.ts
```

## 🔧 **Step 1: Create API Service**

Create `src/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:3000/api/v1';

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

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

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
```

## 🔐 **Step 2: Create Auth Hook**

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect, createContext, useContext } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  handle: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (handle: string, password: string) => Promise<void>;
  register: (handle: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const profile = await apiService.getProfile();
        setUser(profile);
      } catch (error) {
        console.log('No valid session');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (handle: string, password: string) => {
    const response = await apiService.login({ handle, password });
    apiService.setToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (handle: string, email: string, password: string) => {
    const response = await apiService.register({ handle, email, password });
    apiService.setToken(response.accessToken);
    setUser(response.user);
  };

  const logout = () => {
    apiService.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 💰 **Step 3: Create Wallet Hook**

Create `src/hooks/useWallet.ts`:

```typescript
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface WalletBalance {
  currency: string;
  available: string;
  locked: string;
  total: string;
}

export const useWallet = () => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const data = await apiService.getWalletBalances();
      setBalances(data);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const faucet = async (currency: string, amount: string) => {
    try {
      await apiService.faucet(currency, amount);
      await fetchBalances(); // Refresh balances
    } catch (error) {
      console.error('Faucet failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  return {
    balances,
    loading,
    fetchBalances,
    faucet,
  };
};
```

## 🎮 **Step 4: Create Game Components**

### Candle Flip Game (`src/components/games/CandleFlip.tsx`):

```typescript
import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { useWallet } from '../../hooks/useWallet';

export const CandleFlip: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'red' | 'green'>('red');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { fetchBalances } = useWallet();

  const previewBet = async () => {
    try {
      const data = await apiService.previewBet({
        game: 'candle_flip',
        currency: 'USDC',
        stake,
        params: { prediction },
      });
      setPreview(data);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Preview failed: ' + (error as Error).message);
    }
  };

  const placeBet = async () => {
    setLoading(true);
    try {
      const bet = await apiService.placeBet({
        game: 'candle_flip',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: { prediction },
      });
      
      // Resolve bet immediately for demo
      const result = await apiService.resolveBet(bet.id);
      await fetchBalances();
      
      alert(`Bet placed! Outcome: ${result.outcome}, Multiplier: ${result.resultMultiplier}x`);
    } catch (error) {
      console.error('Bet failed:', error);
      alert('Bet failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">🕯️ Candle Flip</h2>
      <p className="text-gray-300 mb-6">Predict the next candle color</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Stake (USDC):
          </label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Prediction:
          </label>
          <div className="flex space-x-4">
            <button
              className={`px-6 py-3 rounded font-bold transition-colors ${
                prediction === 'red' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setPrediction('red')}
            >
              🔴 Red
            </button>
            <button
              className={`px-6 py-3 rounded font-bold transition-colors ${
                prediction === 'green' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setPrediction('green')}
            >
              🟢 Green
            </button>
          </div>
        </div>
        
        <button
          onClick={previewBet}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold transition-colors"
        >
          Preview Bet
        </button>
        
        {preview && (
          <div className="bg-gray-700 rounded p-4 border border-gray-600">
            <h3 className="text-lg font-bold text-green-400 mb-2">Bet Preview</h3>
            <p className="text-gray-300">Potential Payout: <span className="text-green-400 font-bold">{preview.potentialPayout} USDC</span></p>
            <p className="text-gray-300">Win Chance: <span className="text-blue-400 font-bold">{(preview.winChance * 100).toFixed(1)}%</span></p>
            <p className="text-gray-300">Multiplier: <span className="text-yellow-400 font-bold">{preview.multiplier}x</span></p>
          </div>
        )}
        
        <button
          onClick={placeBet}
          disabled={loading || !preview}
          className="w-full px-4 py-3 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 rounded font-bold transition-colors"
        >
          {loading ? 'Placing Bet...' : 'Place Bet'}
        </button>
      </div>
    </div>
  );
};
```

### Wallet Balance Component (`src/components/wallet/WalletBalance.tsx`):

```typescript
import React from 'react';
import { useWallet } from '../../hooks/useWallet';

export const WalletBalance: React.FC = () => {
  const { balances, loading, faucet } = useWallet();

  const handleFaucet = async () => {
    try {
      await faucet('USDC', '100.00');
      alert('Successfully received 100 USDC from faucet!');
    } catch (error) {
      alert('Faucet failed: ' + (error as Error).message);
    }
  };

  const usdcBalance = balances.find(b => b.currency === 'USDC');

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">💰 Wallet</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">USDC Balance:</span>
          <span className="text-green-400 font-bold text-lg">
            {usdcBalance?.available || '0'} USDC
          </span>
        </div>
        
        <button
          onClick={handleFaucet}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition-colors"
        >
          🚰 Get Demo Funds (100 USDC)
        </button>
      </div>
    </div>
  );
};
```

## 🔐 **Step 5: Create Auth Components**

### Login Form (`src/components/auth/LoginForm.tsx`):

```typescript
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(handle, password);
    } catch (error) {
      alert('Login failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Login</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Handle:
          </label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Enter your handle"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            placeholder="Enter your password"
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 rounded font-bold transition-colors"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p className="text-center text-gray-400 mt-4 text-sm">
        Demo users: demo_user_1, demo_user_2, admin<br/>
        Password: password123
      </p>
    </div>
  );
};
```

## 🏠 **Step 6: Update Main App**

Update your `src/App.tsx`:

```typescript
import React from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { WalletBalance } from './components/wallet/WalletBalance';
import { CandleFlip } from './components/games/CandleFlip';
import { LoginForm } from './components/auth/LoginForm';

const AppContent: React.FC = () => {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">🎰 Casino</h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, <span className="font-bold text-white">{user.handle}</span></span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Wallet */}
          <div>
            <WalletBalance />
          </div>
          
          {/* Games */}
          <div>
            <CandleFlip />
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
```

## 🚀 **Step 7: Test the Integration**

1. **Start your backend** (already running)
2. **Run your Lovable frontend**
3. **Test the flow**:
   - Login with demo user: `demo_user_1` / `password123`
   - Get faucet funds (100 USDC)
   - Place a Candle Flip bet
   - See the result and balance update

## 🎯 **Next Steps**

Once the basic integration works:

1. **Add more games** (To the Moon, Diamond Hands, etc.)
2. **Add bet history** component
3. **Add fairness verification** feature
4. **Improve UI/UX** with animations
5. **Add mobile responsiveness**

## 🆘 **Troubleshooting**

### Common Issues:

1. **CORS Error**: Make sure your backend is running on port 3000
2. **Network Error**: Check that the API URL is correct
3. **Auth Error**: Verify the demo user credentials
4. **Build Error**: Check that all imports are correct

### Test API Directly:
- Visit: http://localhost:3000/docs
- Try the `/health` endpoint
- Test `/auth/login` with demo credentials

Your casino backend is fully ready - now let's get your Lovable frontend connected! 🎰
