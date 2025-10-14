# 🔍 Negative Balance Debug Guide

## ❌ **Problem**
Account showing **-10 USDC** total in testnet balance, but user added 20 USDC and other crypto from testnet faucet.

## 🔍 **Root Cause Analysis**

The issue is likely that the backend is still using the **old ledger-based balance calculation** instead of the **new direct account balance calculation**.

### **Old Method (Problematic)**
```typescript
// Sums up all ledger entries (including negative ones from locked funds)
const available = await this.ledgerService.getAccountBalanceByCurrency(account.id, currency);
```

### **New Method (Fixed)**
```typescript
// Uses direct wallet account balance
const available = account.available;
```

## 🚀 **Fix Applied**

I've forced a redeploy of the backend with the corrected balance calculation. The backend should now:

1. ✅ Use direct `walletAccount.available` field
2. ✅ Not sum up ledger entries (which include negative entries from locked funds)
3. ✅ Show correct positive balances after faucet

## 🧪 **Debugging Tools Created**

### **1. BalanceDebugTest.tsx**
```tsx
import { BalanceDebugTest } from './BalanceDebugTest';
<BalanceDebugTest />
```
- Shows both regular and detailed balance responses
- Displays network information
- Analyzes balance data structure

### **2. FaucetDebugTest.tsx**
```tsx
import { FaucetDebugTest } from './FaucetDebugTest';
<FaucetDebugTest />
```
- Tests faucet functionality
- Shows network consistency
- Displays faucet results

### **3. Enhanced Logging**
Added debug logging to:
- `TestnetFaucet.tsx` - Faucet operations
- `WalletBalanceDropdown.tsx` - Balance fetching

## 🎯 **Expected Behavior After Fix**

### **Before Fix**
- ❌ Balance shows: -10 USDC
- ❌ Faucet adds funds but balance doesn't update
- ❌ Inconsistent balance calculation

### **After Fix**
- ✅ Balance shows: +20 USDC (or whatever you added)
- ✅ Faucet adds funds and balance updates immediately
- ✅ Consistent balance calculation

## 🧪 **How to Test**

### **Step 1: Wait for Deployment**
Railway should redeploy automatically. Wait 2-3 minutes.

### **Step 2: Test Faucet**
1. Go to testnet mode
2. Use faucet to add USDC
3. Check if balance updates to positive value

### **Step 3: Use Debug Components**
Add these to your app temporarily:
```tsx
import { BalanceDebugTest } from './BalanceDebugTest';
import { FaucetDebugTest } from './FaucetDebugTest';

// In your app
<BalanceDebugTest />
<FaucetDebugTest />
```

### **Step 4: Check Console Logs**
Look for these debug messages:
```
🧪 FAUCET DEBUG: Calling faucet for USDC on network testnet
🧪 BALANCE DEBUG: Network used: testnet
🧪 BALANCE DEBUG: API endpoint called: /wallets?network=testnet
```

## 🔧 **If Issue Persists**

### **Check 1: Network Consistency**
Ensure faucet and balance API use the same network:
- Faucet: `testnet`
- Balance API: `testnet`

### **Check 2: Backend Deployment**
Verify the backend is running the latest code by checking:
- Railway deployment logs
- API response structure

### **Check 3: Database State**
The issue might be that old ledger entries are causing negative balances. The fix should resolve this by using direct account balances.

## 🎉 **Expected Results**

After the redeploy, you should see:

1. **✅ Positive Balances**: -10 USDC → +20 USDC
2. **✅ Real-time Updates**: Balance changes immediately after faucet
3. **✅ Consistent Calculation**: Same balance shown everywhere
4. **✅ Working Games**: Games can use the correct balance for betting

## 📁 **Files to Copy**

Copy these debug components to your Lovable project:

```
lovable-files/BalanceDebugTest.tsx      ← Balance debugging
lovable-files/FaucetDebugTest.tsx       ← Faucet debugging
lovable-files/TestnetFaucet.tsx         ← Enhanced logging
lovable-files/WalletBalanceDropdown.tsx ← Enhanced logging
```

The negative balance issue should be resolved after the backend redeploys! 🎰
