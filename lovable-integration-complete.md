# 🎰 Complete Lovable + Casino Backend Integration

## 🚀 Deployment Strategy: Option B (Recommended)

### Why This Approach?
- ✅ Keep your complex NestJS backend intact
- ✅ Deploy backend separately for security
- ✅ Frontend calls deployed API
- ✅ Full control over database and Redis
- ✅ Production-ready architecture

## 📋 Step-by-Step Integration

### Step 1: Deploy Backend to Railway

#### 1.1 Prepare for Deployment
```bash
# In your casino directory
# Create railway.json
echo '{
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "healthcheckPath": "/api/v1/health"
  }
}' > railway.json
```

#### 1.2 Deploy to Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

#### 1.3 Set Environment Variables in Railway
```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
REDIS_HOST=containers-us-west-xxx.railway.app
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key
NODE_ENV=production
PORT=3000
DEMO_MODE=true
CORS_ORIGIN=https://your-lovable-app.lovable.app
```

### Step 2: Set Up Lovable Frontend

#### 2.1 Create New Lovable Project
1. Go to [Lovable.dev](https://lovable.dev)
2. Create "React + TypeScript + Tailwind" project
3. Name it "casino-frontend"

#### 2.2 Copy Integration Files
Copy these files to your Lovable project:

**src/types/index.ts**
```typescript
export interface User {
  id: string;
  handle: string;
  email?: string;
}

export interface WalletBalance {
  currency: string;
  available: string;
  locked: string;
  total: string;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  houseEdge: number;
  rtp: number;
}

export interface BetPreview {
  game: string;
  currency: string;
  stake: string;
  potentialPayout: string;
  winChance: number;
  multiplier: number;
  houseEdge: number;
}

export interface Bet {
  id: string;
  game: string;
  currency: string;
  stake: string;
  potentialPayout: string;
  outcome?: string;
  resultMultiplier?: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'CASHED_OUT';
  clientSeed: string;
  serverSeedHash: string;
  nonce: number;
  createdAt: string;
  resolvedAt?: string;
}
```

**src/services/api.ts**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-deployed-backend.railway.app/api/v1';

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

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
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

**src/hooks/useAuth.ts**
```typescript
import { useState, useEffect, createContext, useContext } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';

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

**src/hooks/useWallet.ts**
```typescript
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { WalletBalance } from '../types';

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
      await fetchBalances();
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

#### 2.3 Create Main Components

**src/components/auth/LoginForm.tsx**
```typescript
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(handle, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-center mb-6 text-yellow-400">Login</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Handle or Email</label>
          <input
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
            required
          />
        </div>
        
        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 text-gray-900 py-2 rounded font-bold hover:bg-yellow-300 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};
```

**src/components/wallet/WalletBalance.tsx**
```typescript
import React from 'react';
import { useWallet } from '../../hooks/useWallet';
import { useAuth } from '../../hooks/useAuth';

export const WalletBalance: React.FC = () => {
  const { balances, faucet, loading } = useWallet();
  const { user } = useAuth();

  const usdcBalance = balances.find(b => b.currency === 'USDC');

  const handleFaucet = async () => {
    try {
      await faucet('USDC', '100.00');
      alert('Successfully added 100 USDC!');
    } catch (error: any) {
      alert(`Faucet failed: ${error.message}`);
    }
  };

  if (!user) return null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-bold mb-4 text-yellow-400">Wallet</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {balances.map((balance) => (
          <div key={balance.currency} className="bg-gray-700 rounded p-4">
            <div className="text-sm text-gray-400">{balance.currency}</div>
            <div className="text-lg font-bold text-green-400">
              {parseFloat(balance.available).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Available
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4">
        <button
          onClick={handleFaucet}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Getting Funds...' : 'Get Demo Funds (100 USDC)'}
        </button>
      </div>
    </div>
  );
};
```

**src/components/games/CandleFlip.tsx**
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
      
      alert(`Bet ${result.status}! Multiplier: ${result.resultMultiplier}x`);
    } catch (error: any) {
      alert(`Bet failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4 text-yellow-400">Candle Flip</h3>
      <p className="text-gray-400 mb-6">Predict the next candle color</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Stake (USDC)</label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-yellow-400"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Prediction</label>
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded ${
                prediction === 'red' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setPrediction('red')}
            >
              Red
            </button>
            <button
              className={`px-4 py-2 rounded ${
                prediction === 'green' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setPrediction('green')}
            >
              Green
            </button>
          </div>
        </div>
        
        <button
          onClick={previewBet}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Preview Bet
        </button>
        
        {preview && (
          <div className="bg-gray-700 rounded p-4">
            <h4 className="font-bold mb-2">Bet Preview</h4>
            <p>Potential Payout: <span className="text-green-400">{preview.potentialPayout} USDC</span></p>
            <p>Win Chance: <span className="text-yellow-400">{(preview.winChance * 100).toFixed(1)}%</span></p>
            <p>Multiplier: <span className="text-blue-400">{preview.multiplier}x</span></p>
          </div>
        )}
        
        <button
          onClick={placeBet}
          disabled={loading || !preview}
          className="w-full bg-yellow-400 text-gray-900 py-2 rounded font-bold hover:bg-yellow-300 disabled:opacity-50"
        >
          {loading ? 'Placing Bet...' : 'Place Bet'}
        </button>
      </div>
    </div>
  );
};
```

#### 2.4 Update Main App

**src/App.tsx**
```typescript
import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { WalletBalance } from './components/wallet/WalletBalance';
import { CandleFlip } from './components/games/CandleFlip';
import { useAuth } from './hooks/useAuth';

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">🎰 Casino</h1>
          <div className="flex items-center space-x-4">
            <span>Welcome, <span className="font-bold">{user.handle}</span></span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <WalletBalance />
        <CandleFlip />
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

### Step 3: Environment Configuration

#### 3.1 In Lovable Project
Create `.env.local`:
```env
REACT_APP_API_URL=https://your-deployed-backend.railway.app/api/v1
```

#### 3.2 Update CORS in Backend
Make sure your deployed backend has the correct CORS origin:
```env
CORS_ORIGIN=https://your-lovable-app.lovable.app
```

## 🎯 Testing the Integration

### 1. Test Backend Deployment
```bash
# Test health endpoint
curl https://your-deployed-backend.railway.app/api/v1/health

# Test games endpoint
curl https://your-deployed-backend.railway.app/api/v1/games
```

### 2. Test Frontend
1. Open your Lovable app
2. Register a new user
3. Get demo funds from faucet
4. Place a Candle Flip bet
5. Verify the bet resolves correctly

## 🚀 Success Criteria

✅ Backend deployed and accessible  
✅ Frontend connects to deployed API  
✅ User can register and login  
✅ Faucet works and adds funds  
✅ Bets can be placed and resolved  
✅ Balances update correctly  
✅ No CORS errors  

## 🎉 You're Ready!

This integration gives you:
- **Production-ready backend** with full casino functionality
- **Beautiful frontend** built with Lovable
- **Scalable architecture** that can handle real users
- **Complete game suite** with provably fair mechanics

Your casino is now ready for real users! 🎰
