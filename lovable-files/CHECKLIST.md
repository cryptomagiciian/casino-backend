# ✅ Casino Integration Checklist

## 🎯 Pre-Flight Checklist

Before you deploy, make sure you have:

---

## 📦 **Files Copied**

### Core Services
- [ ] `api.ts` → `src/services/api.ts`
- [ ] Backend URL updated to Railway

### Hooks
- [ ] `useAuth.ts` → `src/hooks/useAuth.ts`
- [ ] `useWallet.ts` → `src/hooks/useWallet.ts`

### Auth Components
- [ ] `LoginForm.tsx` → `src/components/auth/LoginForm.tsx`
- [ ] `RegisterForm.tsx` → `src/components/auth/RegisterForm.tsx`

### Wallet Components
- [ ] `WalletBalance.tsx` → `src/components/wallet/WalletBalance.tsx`

### Game Components
- [ ] `CandleFlip.tsx` → `src/components/games/CandleFlip.tsx`
- [ ] `ToTheMoon.tsx` → `src/components/games/ToTheMoon.tsx`
- [ ] `PumpOrDump.tsx` → `src/components/games/PumpOrDump.tsx`
- [ ] `SupportOrResistance.tsx` → `src/components/games/SupportOrResistance.tsx`
- [ ] `BullVsBear.tsx` → `src/components/games/BullVsBear.tsx`
- [ ] `LeverageLadder.tsx` → `src/components/games/LeverageLadder.tsx`
- [ ] `StopLossRoulette.tsx` → `src/components/games/StopLossRoulette.tsx`
- [ ] `DiamondHands.tsx` → `src/components/games/DiamondHands.tsx`

### Main App
- [ ] `App.tsx` → Updated or replaced `src/App.tsx`

---

## 🔧 **Configuration**

### API Setup
- [ ] Backend URL: `https://casino-backend-production-8186.up.railway.app/api/v1`
- [ ] CORS configured (already done on backend)
- [ ] API service imported correctly

### Authentication
- [ ] Login form working
- [ ] Register form working
- [ ] JWT token storage (localStorage)
- [ ] Logout functionality

### Wallet
- [ ] Balance display working
- [ ] Faucet button working (100 USDC)
- [ ] Currency selector (USDC default)

---

## 🎮 **Game Testing**

### Test Each Game

#### 1. Candle Flip 🕯️
- [ ] Preview bet works
- [ ] Place bet works
- [ ] Result shows correctly
- [ ] Balance updates

#### 2. To the Moon 🚀
- [ ] Game starts
- [ ] Multiplier grows
- [ ] Cash out works
- [ ] Crash detection works
- [ ] Play again works (no page refresh!)

#### 3. Pump or Dump 📊
- [ ] Round starts with countdown
- [ ] Price chart animates
- [ ] Bet placement works
- [ ] Result resolves correctly
- [ ] Auto-restart works

#### 4. Support or Resistance 📈
- [ ] Support/resistance lines display
- [ ] Price movement animates
- [ ] Break/reject prediction works
- [ ] Payout correct (2.0×)

#### 5. Bull vs Bear Battle 🐂🐻
- [ ] Tug-of-war bar animates
- [ ] Side selection works
- [ ] Winner determined correctly
- [ ] Payout correct (1.98×)

#### 6. Leverage Ladder 🪜
- [ ] 5 rungs display correctly
- [ ] Climb up button works
- [ ] Cash out works
- [ ] Liquidation works
- [ ] Multipliers correct (1.3× to 4.0×)

#### 7. Stop Loss Roulette ⚡
- [ ] Risk slider works (1-10)
- [ ] Wheel spins
- [ ] Payout calculation correct (1.5× to 3.0×)
- [ ] Stop loss detection works

#### 8. Diamond Hands 💎
- [ ] 5×5 grid displays
- [ ] Tile clicking works
- [ ] Diamond reveals animate
- [ ] Mine explosions work
- [ ] Multiplier grows exponentially
- [ ] Cash out works

---

## 🐛 **Common Issues**

### If Login Fails
- [ ] Check backend URL in `api.ts`
- [ ] Check browser console for errors
- [ ] Try demo credentials: `demo_user_1` / `password123`

### If Faucet Fails
- [ ] Check if already claimed (24h cooldown)
- [ ] Check browser console
- [ ] Try different currency

### If Games Don't Load
- [ ] Check all imports are correct
- [ ] Check file paths match your structure
- [ ] Check browser console for errors

### If Balance Doesn't Update
- [ ] Check `fetchBalances()` is called after bets
- [ ] Check network tab for API responses
- [ ] Refresh page to force balance sync

---

## 📱 **Mobile Testing**

- [ ] Login works on mobile
- [ ] Games display correctly
- [ ] Buttons are tappable
- [ ] Animations smooth
- [ ] No horizontal scroll

---

## 🎨 **Visual Check**

- [ ] Colors look good
- [ ] Animations are smooth
- [ ] Text is readable
- [ ] Buttons are clickable
- [ ] Loading states show
- [ ] Error messages display

---

## 🔒 **Security Check**

- [ ] JWT token stored securely
- [ ] No sensitive data in console
- [ ] CORS configured properly
- [ ] Rate limiting working (backend)
- [ ] No SQL injection vulnerabilities (backend)

---

## 🚀 **Performance Check**

- [ ] Page loads quickly
- [ ] Games respond instantly
- [ ] No memory leaks (intervals cleaned up)
- [ ] Images optimized
- [ ] No unnecessary re-renders

---

## 📊 **Final Testing Flow**

### Complete User Journey:
1. [ ] **Register** new account
2. [ ] **Login** successfully
3. [ ] **View** wallet balance (should be 0)
4. [ ] **Get** demo funds from faucet (100 USDC)
5. [ ] **Play** Candle Flip (bet 10 USDC)
6. [ ] **See** balance update (win or loss)
7. [ ] **Play** To the Moon (bet 10 USDC)
8. [ ] **Cash out** successfully
9. [ ] **Try** all 8 games
10. [ ] **Verify** all games work
11. [ ] **Logout** and login again
12. [ ] **Check** balance persisted

---

## ✅ **Launch Ready?**

If all boxes are checked:
- ✅ **YES!** Deploy and celebrate! 🎉
- ❌ **NO?** Review issues and fix them first.

---

## 🎉 **Post-Launch**

After launch:
- [ ] Monitor error logs
- [ ] Check user feedback
- [ ] Track game popularity
- [ ] Add more games if needed
- [ ] Optimize based on usage
- [ ] Add sound effects
- [ ] Add leaderboards
- [ ] Add bet history

---

**Good luck with your launch! 🚀🎰💎**

