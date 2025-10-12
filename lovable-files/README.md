# 🎰 Casino Frontend Files for Lovable

## 📁 File Structure

Copy these files to your Lovable project in the following structure:

```
src/
├── services/
│   └── api.ts                    ← Copy from lovable-files/api.ts
├── hooks/
│   ├── useAuth.ts               ← Copy from lovable-files/useAuth.ts
│   └── useWallet.ts             ← Copy from lovable-files/useWallet.ts
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx        ← Copy from lovable-files/LoginForm.tsx
│   │   └── RegisterForm.tsx     ← Copy from lovable-files/RegisterForm.tsx
│   ├── games/
│   │   ├── GameList.tsx         ← Copy from lovable-files/GameList.tsx
│   │   ├── CandleFlip.tsx       ← Copy from lovable-files/CandleFlip.tsx
│   │   └── ToTheMoon.tsx        ← Copy from lovable-files/ToTheMoon.tsx
│   └── wallet/
│       └── WalletBalance.tsx    ← Copy from lovable-files/WalletBalance.tsx
└── App.tsx                      ← Replace with lovable-files/App.tsx
```

## 🚀 Quick Setup Steps

### 1. Create Folders
In your Lovable project, create these folders:
- `src/services/`
- `src/hooks/`
- `src/components/auth/`
- `src/components/games/`
- `src/components/wallet/`

### 2. Copy Files
Copy each file from the `lovable-files/` folder to the corresponding location in your Lovable project.

### 3. Update Imports
Make sure all import paths are correct. The files are set up to work with the folder structure above.

### 4. Test the Integration

**Demo Credentials:**
- **Username**: `demo_user_1`, `demo_user_2`, or `admin`
- **Password**: `password123`

**Test Flow:**
1. Login with demo credentials
2. Click "Get Demo Funds" (100 USDC)
3. Select "Candle Flip" game
4. Place a bet and see the result
5. Try "To the Moon" crash game

## 🎮 Available Games

The frontend includes:
- ✅ **Candle Flip** - Predict red/green candle
- ✅ **To the Moon** - Crash game with cashout
- 🔄 **More games** can be added by following the same pattern

## 🔧 Backend Requirements

Make sure your casino backend is running:
- **API URL**: `http://localhost:3000/api/v1`
- **Health Check**: `http://localhost:3000/api/v1/health`
- **API Docs**: `http://localhost:3000/docs`

## 🎯 Features Included

- ✅ **Authentication** - Login/Register with JWT
- ✅ **Wallet System** - Balance display + faucet
- ✅ **Game Selection** - Choose from available games
- ✅ **Betting System** - Place and resolve bets
- ✅ **Real-time Updates** - Balance updates after bets
- ✅ **Error Handling** - Proper error messages
- ✅ **Responsive Design** - Works on mobile

## 🆘 Troubleshooting

### Common Issues:

1. **CORS Error**: Make sure backend is running on port 3000
2. **Network Error**: Check API URL in api.ts
3. **Auth Error**: Verify demo user credentials
4. **Build Error**: Check import paths

### Test Backend:
- Visit: http://localhost:3000/docs
- Try: http://localhost:3000/api/v1/health

## 🚀 Next Steps

After basic integration works:
1. **Add more games** (Diamond Hands, Leverage Ladder, etc.)
2. **Add bet history** component
3. **Add fairness verification** feature
4. **Improve UI/UX** with animations
5. **Add leaderboard** component

Your casino backend is fully ready with all 9 games implemented! 🎰
