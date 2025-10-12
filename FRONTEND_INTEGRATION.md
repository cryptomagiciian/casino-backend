# Casino Frontend Integration with Lovable

## 🎯 Overview

This guide shows how to integrate the casino backend with a Lovable frontend. We'll create a modern React frontend that connects to our NestJS API.

## 🚀 Quick Setup

### 1. Backend API Endpoints

Your casino backend is running at:
- **Base URL**: `http://localhost:3000/api/v1`
- **Swagger Docs**: `http://localhost:3000/docs`

### 2. Key API Endpoints for Frontend

```typescript
// Authentication
POST /auth/register
POST /auth/login
GET /auth/me

// Wallets
GET /wallets
POST /wallets/faucet

// Games
GET /games
POST /bets/preview
POST /bets/place
GET /bets

// Fairness
GET /fairness/seed/current
POST /fairness/verify
```

## 🎨 Frontend Architecture

### Recommended Lovable Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── UserProfile.tsx
│   ├── games/
│   │   ├── GameList.tsx
│   │   ├── CandleFlip.tsx
│   │   ├── ToTheMoon.tsx
│   │   ├── DiamondHands.tsx
│   │   └── GamePreview.tsx
│   ├── wallet/
│   │   ├── WalletBalance.tsx
│   │   ├── FaucetButton.tsx
│   │   └── TransactionHistory.tsx
│   └── shared/
│       ├── Layout.tsx
│       ├── Header.tsx
│       └── LoadingSpinner.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useWallet.ts
│   ├── useGames.ts
│   └── useBets.ts
├── services/
│   ├── api.ts
│   ├── auth.ts
│   └── games.ts
├── types/
│   ├── auth.ts
│   ├── wallet.ts
│   ├── games.ts
│   └── bets.ts
└── utils/
    ├── constants.ts
    └── helpers.ts
```

## 🔧 API Service Setup

### 1. Base API Service (`services/api.ts`)

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
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
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

### 2. Auth Hook (`hooks/useAuth.ts`)

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

### 3. Wallet Hook (`hooks/useWallet.ts`)

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

## 🎮 Game Components

### 1. Candle Flip Game (`components/games/CandleFlip.tsx`)

```typescript
import React, { useState } from 'react';
import { apiService } from '../../services/api';
import { useWallet } from '../../hooks/useWallet';

export const CandleFlip: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [prediction, setPrediction] = useState<'red' | 'green'>('red');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { balances, fetchBalances } = useWallet();

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
      await apiService.resolveBet(bet.id);
      await fetchBalances();
      
      alert(`Bet placed! Outcome: ${bet.outcome}`);
    } catch (error) {
      console.error('Bet failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="candle-flip-game">
      <h2>Candle Flip</h2>
      <p>Predict the next candle color</p>
      
      <div className="bet-controls">
        <div>
          <label>Stake (USDC):</label>
          <input
            type="number"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            step="0.01"
            min="0.01"
          />
        </div>
        
        <div>
          <label>Prediction:</label>
          <div>
            <button
              className={prediction === 'red' ? 'selected' : ''}
              onClick={() => setPrediction('red')}
            >
              Red
            </button>
            <button
              className={prediction === 'green' ? 'selected' : ''}
              onClick={() => setPrediction('green')}
            >
              Green
            </button>
          </div>
        </div>
        
        <button onClick={previewBet}>Preview Bet</button>
        
        {preview && (
          <div className="bet-preview">
            <p>Potential Payout: {preview.potentialPayout} USDC</p>
            <p>Win Chance: {(preview.winChance * 100).toFixed(1)}%</p>
            <p>Multiplier: {preview.multiplier}x</p>
          </div>
        )}
        
        <button
          onClick={placeBet}
          disabled={loading || !preview}
          className="place-bet-btn"
        >
          {loading ? 'Placing Bet...' : 'Place Bet'}
        </button>
      </div>
    </div>
  );
};
```

### 2. To the Moon Crash Game (`components/games/ToTheMoon.tsx`)

```typescript
import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import { useWallet } from '../../hooks/useWallet';

export const ToTheMoon: React.FC = () => {
  const [stake, setStake] = useState('10.00');
  const [multiplier, setMultiplier] = useState(1.0);
  const [isRunning, setIsRunning] = useState(false);
  const [betId, setBetId] = useState<string | null>(null);
  const [crashed, setCrashed] = useState(false);
  const { fetchBalances } = useWallet();

  const startGame = async () => {
    try {
      const bet = await apiService.placeBet({
        game: 'to_the_moon',
        currency: 'USDC',
        stake,
        clientSeed: Math.random().toString(36),
        params: {},
      });
      
      setBetId(bet.id);
      setIsRunning(true);
      setCrashed(false);
      setMultiplier(1.0);
      
      // Simulate multiplier growth
      const interval = setInterval(() => {
        setMultiplier(prev => {
          const newMultiplier = prev + 0.01;
          // Random crash simulation (1% chance each step)
          if (Math.random() < 0.01) {
            setCrashed(true);
            setIsRunning(false);
            clearInterval(interval);
            resolveBet(bet.id, newMultiplier);
            return newMultiplier;
          }
          return newMultiplier;
        });
      }, 100);
      
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  };

  const cashout = async () => {
    if (betId) {
      try {
        await apiService.cashoutBet(betId);
        setIsRunning(false);
        await fetchBalances();
        alert(`Cashed out at ${multiplier.toFixed(2)}x!`);
      } catch (error) {
        console.error('Cashout failed:', error);
      }
    }
  };

  const resolveBet = async (id: string, finalMultiplier: number) => {
    try {
      await apiService.resolveBet(id);
      await fetchBalances();
      alert(`Crashed at ${finalMultiplier.toFixed(2)}x!`);
    } catch (error) {
      console.error('Bet resolution failed:', error);
    }
  };

  return (
    <div className="to-the-moon-game">
      <h2>To the Moon</h2>
      <p>Watch the multiplier grow and cash out before it crashes!</p>
      
      <div className="game-display">
        <div className={`multiplier ${crashed ? 'crashed' : ''}`}>
          {multiplier.toFixed(2)}x
        </div>
        
        {!isRunning && !crashed && (
          <div className="bet-controls">
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              step="0.01"
              min="0.01"
              placeholder="Stake (USDC)"
            />
            <button onClick={startGame}>Start Game</button>
          </div>
        )}
        
        {isRunning && (
          <button onClick={cashout} className="cashout-btn">
            Cash Out
          </button>
        )}
        
        {crashed && (
          <button onClick={() => window.location.reload()}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
};
```

## 🎨 Styling with Tailwind CSS

### Main Layout (`components/shared/Layout.tsx`)

```typescript
import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
```

### Header Component (`components/shared/Header.tsx`)

```typescript
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWallet } from '../../hooks/useWallet';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { balances } = useWallet();

  const usdcBalance = balances.find(b => b.currency === 'USDC');

  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-yellow-400">🎰 Casino</h1>
        
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="text-sm">
                <span className="text-gray-400">Balance: </span>
                <span className="font-bold text-green-400">
                  {usdcBalance?.available || '0'} USDC
                </span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Welcome, </span>
                <span className="font-bold">{user.handle}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
```

## 🚀 Lovable Integration Steps

### 1. Create New Lovable Project
1. Go to [Lovable.dev](https://lovable.dev)
2. Create a new React project
3. Choose TypeScript and Tailwind CSS

### 2. Install Dependencies
```bash
npm install axios
# or use fetch API (already available)
```

### 3. Copy the Code
- Copy the service files to `src/services/`
- Copy the hooks to `src/hooks/`
- Copy the components to `src/components/`
- Copy the types to `src/types/`

### 4. Set Up Environment
Create `.env.local`:
```env
REACT_APP_API_URL=http://localhost:3000/api/v1
```

### 5. Update API Service
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';
```

### 6. Main App Component
```typescript
import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { Layout } from './components/shared/Layout';
import { GameList } from './components/games/GameList';
import { LoginForm } from './components/auth/LoginForm';

function App() {
  return (
    <AuthProvider>
      <Layout>
        <GameList />
      </Layout>
    </AuthProvider>
  );
}

export default App;
```

## 🎯 Key Features to Implement

### 1. Authentication Flow
- Login/Register forms
- Protected routes
- User profile management

### 2. Wallet Management
- Balance display
- Faucet button (demo mode)
- Transaction history

### 3. Game Interface
- Game selection
- Bet placement
- Real-time updates
- Fairness verification

### 4. Responsive Design
- Mobile-friendly
- Dark theme
- Smooth animations

## 🔧 Development Tips

### 1. Start Simple
- Begin with authentication
- Add wallet balance display
- Implement one game (Candle Flip)
- Gradually add more games

### 2. Error Handling
```typescript
const handleApiError = (error: any) => {
  if (error.message.includes('401')) {
    // Redirect to login
  } else if (error.message.includes('400')) {
    // Show validation error
  } else {
    // Show generic error
  }
};
```

### 3. Loading States
```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await apiCall();
  } finally {
    setLoading(false);
  }
};
```

### 4. Real-time Updates
For real-time features, consider:
- WebSocket connection
- Polling for updates
- Server-sent events

## 🎉 Ready to Build!

With this setup, you can create a fully functional casino frontend that integrates seamlessly with your NestJS backend. The Lovable platform will help you build a beautiful, responsive UI quickly while the backend handles all the complex game logic and provably fair mechanics.

Start with the authentication flow, then add the wallet features, and finally implement the games one by one. The modular architecture makes it easy to add new features incrementally.
