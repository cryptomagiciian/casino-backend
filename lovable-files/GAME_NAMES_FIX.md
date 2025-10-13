# ⚠️ IMPORTANT: Game Name Format Fix

## 🐛 Issue Found & Fixed

The frontend was using **hyphens** (`candle-flip`) but the backend expects **underscores** (`candle_flip`).

---

## ✅ Correct Game Names (Use These!)

| Frontend Display | Backend API Name (Correct) | ❌ Wrong |
|-----------------|---------------------------|---------|
| 🕯️ Candle Flip | `candle_flip` | ~~candle-flip~~ |
| 🚀 To the Moon | `to_the_moon` | ~~to-the-moon~~ |
| 📊 Pump or Dump | `pump_or_dump` | ~~pump-or-dump~~ |
| 📈 Support or Resistance | `support_or_resistance` | ~~support-or-resistance~~ |
| 🐂 Bull vs Bear | `bull_vs_bear_battle` | ~~bull-vs-bear-battle~~ |
| 🪜 Leverage Ladder | `leverage_ladder` | ~~leverage-ladder~~ |
| ⚡ Stop Loss Roulette | `stop_loss_roulette` | ~~stop-loss-roulette~~ |
| 💎 Diamond Hands | `diamond_hands` | ~~diamond-hands~~ |

---

## ✅ All Game Files Updated

I've already fixed all the game component files:
- ✅ `CandleFlip.tsx` - Now uses `candle_flip`
- ✅ `ToTheMoon.tsx` - Now uses `to_the_moon`
- ✅ `PumpOrDump.tsx` - Now uses `pump_or_dump`
- ✅ `SupportOrResistance.tsx` - Now uses `support_or_resistance`
- ✅ `BullVsBear.tsx` - Now uses `bull_vs_bear_battle`
- ✅ `LeverageLadder.tsx` - Now uses `leverage_ladder`
- ✅ `StopLossRoulette.tsx` - Now uses `stop_loss_roulette`
- ✅ `DiamondHands.tsx` - Now uses `diamond_hands`

---

## 🔧 What Changed

### Before (Wrong):
```typescript
const bet = await apiService.placeBet({
  game: 'candle-flip',  // ❌ This was causing "Game not found" errors
  // ...
});
```

### After (Correct):
```typescript
const bet = await apiService.placeBet({
  game: 'candle_flip',  // ✅ Now matches backend
  // ...
});
```

---

## 🎮 Testing

All games should now work! Try each one:
1. ✅ Candle Flip
2. ✅ To the Moon
3. ✅ Pump or Dump
4. ✅ Support or Resistance
5. ✅ Bull vs Bear Battle
6. ✅ Leverage Ladder
7. ✅ Stop Loss Roulette
8. ✅ Diamond Hands

---

## 📝 For Future Reference

When adding new games:
- **Always use underscores** in game identifiers
- Match the backend constants in `src/shared/constants.ts`
- Example: `new_game_name` not `new-game-name`

---

**All games are now fixed and ready to use!** 🎉

