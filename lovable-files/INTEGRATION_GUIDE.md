# 🎰 Casino Frontend Integration Guide

## 📦 What You Have

### ✅ Complete Package:
- **8 Game Components** (all with animations!)
- **Auth System** (login, register, JWT)
- **Wallet System** (balances, faucet)
- **API Service** (ready to connect)
- **Deployed Backend** (Railway)

---

## 🚀 Quick Start (5 Minutes!)

### Step 1: Copy Files to Lovable

In your Lovable project, create this structure:

```
src/
├── services/
│   └── api.ts                    ← lovable-files/api.ts
├── hooks/
│   ├── useAuth.tsx               ← lovable-files/useAuth.tsx
│   └── useWallet.tsx             ← lovable-files/useWallet.tsx
└── components/
    ├── auth/
    │   ├── LoginForm.tsx         ← lovable-files/LoginForm.tsx
    │   └── RegisterForm.tsx      ← lovable-files/RegisterForm.tsx
    ├── wallet/
    │   └── WalletBalance.tsx     ← lovable-files/WalletBalance.tsx
    └── games/
        ├── CandleFlip.tsx        ← lovable-files/CandleFlip.tsx
        ├── ToTheMoon.tsx         ← lovable-files/ToTheMoon.tsx
        ├── PumpOrDump.tsx        ← lovable-files/PumpOrDump.tsx
        ├── SupportOrResistance.tsx
        ├── BullVsBear.tsx
        ├── LeverageLadder.tsx
        ├── StopLossRoulette.tsx
        └── DiamondHands.tsx
```

### Step 2: Update API URL

In `src/services/api.ts`, update the base URL:

```typescript
private baseURL = 'https://casino-backend-production-8186.up.railway.app/api/v1';
```

✅ This is already your deployed backend!

### Step 3: Create a Game Selector

Create `src/components/games/GameSelector.tsx`:

```tsx
import React, { useState } from 'react';
import { CandleFlip } from './CandleFlip';
import { ToTheMoon } from './ToTheMoon';
import { PumpOrDump } from './PumpOrDump';
import { SupportOrResistance } from './SupportOrResistance';
import { BullVsBear } from './BullVsBear';
import { LeverageLadder } from './LeverageLadder';
import { StopLossRoulette } from './StopLossRoulette';
import { DiamondHands } from './DiamondHands';

const games = [
  { id: 'candle_flip', name: '🕯️ Candle Flip', component: CandleFlip },
  { id: 'to_the_moon', name: '🚀 To the Moon', component: ToTheMoon },
  { id: 'pump_or_dump', name: '📊 Pump or Dump', component: PumpOrDump },
  { id: 'support_or_resistance', name: '📈 S/R', component: SupportOrResistance },
  { id: 'bull_vs_bear_battle', name: '🐂 Bull vs Bear', component: BullVsBear },
  { id: 'leverage_ladder', name: '🪜 Leverage Ladder', component: LeverageLadder },
  { id: 'stop_loss_roulette', name: '⚡ Stop Loss', component: StopLossRoulette },
  { id: 'diamond_hands', name: '💎 Diamond Hands', component: DiamondHands },
];

export const GameSelector: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState(games[0].id);
  
  const CurrentGame = games.find(g => g.id === selectedGame)?.component;

  return (
    <div className="space-y-6">
      {/* Game Menu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {games.map(game => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`py-3 px-4 rounded-lg font-bold transition-all ${
              selectedGame === game.id
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {game.name}
          </button>
        ))}
      </div>

      {/* Current Game */}
      {CurrentGame && <CurrentGame />}
    </div>
  );
};
```

### Step 4: Update Your Main App

In `src/App.tsx`:

```tsx
import React from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { WalletBalance } from './components/wallet/WalletBalance';
import { GameSelector } from './components/games/GameSelector';

function App() {
  const { user, loading, logout } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        {showRegister ? (
          <div className="max-w-md w-full">
            <RegisterForm />
            <button 
              onClick={() => setShowRegister(false)}
              className="mt-4 text-cyan-400 hover:text-cyan-300"
            >
              Already have an account? Login
            </button>
          </div>
        ) : (
          <div className="max-w-md w-full">
            <LoginForm />
            <button 
              onClick={() => setShowRegister(true)}
              className="mt-4 text-cyan-400 hover:text-cyan-300"
            >
              Need an account? Register
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black">
      {/* Header */}
      <header className="bg-gray-900/50 backdrop-blur border-b border-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            🎰 Crypto Casino
          </h1>
          <button 
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4 md:p-8 space-y-8">
        {/* Wallet */}
        <WalletBalance />
        
        {/* Games */}
        <GameSelector />
      </main>
    </div>
  );
}

export default App;
```

### Step 5: Test!

1. **Register** a new account
2. **Get Demo Funds** (100 USDC faucet)
3. **Play games**:
   - Try Candle Flip
   - Try To the Moon
   - Try all 8 games!
4. **Watch your balance** update after each bet

---

## 🎮 Game Quick Reference

| Game | Type | Payout | Volatility |
|------|------|--------|-----------|
| 🕯️ Candle Flip | Prediction | 1.95× | Low |
| 🚀 To the Moon | Crash | Variable | High |
| 📊 Pump or Dump | Prediction | 1.95× | Medium |
| 📈 S/R | Prediction | 2.0× | Medium |
| 🐂 Bull vs Bear | Battle | 1.98× | Low |
| 🪜 Leverage Ladder | Climb | 1.3-4.0× | High |
| ⚡ Stop Loss | Roulette | 1.5-3.0× | Medium |
| 💎 Diamond Hands | Mines | Exponential | High |

---

## 🔧 Configuration

### Backend URL
Already set to: `https://casino-backend-production-8186.up.railway.app`

### Demo Users (Pre-seeded)
- Username: `demo_user_1`, Password: `password123`
- Username: `demo_user_2`, Password: `password123`
- Username: `admin`, Password: `password123`

### Faucet
- 100 USDC per request
- 24-hour cooldown per currency
- Demo mode enabled

---

## 🎨 Customization

### Colors
Each game has its own theme. You can customize in the component files:
- Candle Flip: Yellow/Orange
- To the Moon: Blue/Purple
- Pump or Dump: Cyan/Blue
- Support/Resistance: Purple/Indigo
- Bull vs Bear: Green/Red/Yellow
- Leverage Ladder: Purple/Indigo
- Stop Loss: Orange/Red
- Diamond Hands: Cyan/Blue

### Animations
All games use:
- `animate-pulse` - for active elements
- `animate-bounce` - for results
- `transition-all` - for smooth state changes
- `transform hover:scale-105` - for button interactions

---

## 🐛 Troubleshooting

### CORS Error
✅ Already configured! Backend allows your Lovable domain.

### 400 Bad Request
✅ All DTOs have proper validation decorators.

### 500 Internal Server Error
Check Railway logs at: https://railway.app/dashboard

### Balance Not Updating
Make sure `fetchBalances()` is called after each bet/cashout.

### Game Not Loading
Check browser console for errors. Make sure all imports are correct.

---

## 🎉 You're Done!

Your casino has:
- ✅ 8 unique games
- ✅ Beautiful UI
- ✅ Smooth animations
- ✅ Real-time balance updates
- ✅ Provably fair gaming
- ✅ Production backend
- ✅ Demo mode

**Ready to launch! 🚀🎰💎**

---

## 📚 Additional Resources

- **Backend API Docs**: https://casino-backend-production-8186.up.railway.app/docs
- **Health Check**: https://casino-backend-production-8186.up.railway.app/api/v1/health
- **Game Details**: See `GAMES_COMPLETE.md`
- **Bug Fixes**: See `FIXES_APPLIED.md`

---

## 💡 Pro Tips

1. **Test each game** individually before launching
2. **Add sound effects** for better UX
3. **Add confetti** on big wins
4. **Show recent winners** to create excitement
5. **Add bet history** for transparency
6. **Enable fairness verification** to build trust

---

**Need help? All backend code is in the casino directory!** 🎰

