# 🔍 Balance Refresh Debug Guide

## ❌ **Problem**
Faucet is working (API calls successful), but balance isn't refreshing after adding funds.

## 🔍 **Root Cause Analysis**

From the logs, I can see:
- ✅ Faucet call successful: `POST /wallets/faucet OK`
- ✅ Balance API calls successful: `GET /wallets OK`
- ❌ But balance doesn't update in UI

The issue is likely that the balance API calls are going to the wrong network:
- **Faucet**: Adds funds to `testnet`
- **Balance API**: Might be checking `mainnet` (default)

## 🧪 **Debug Tools Created**

### **1. Enhanced Logging**
Added debug logging to:
- `WalletBalanceDropdown.tsx` - Shows network value and type
- `api.ts` - Shows actual API endpoint being called

### **2. NetworkDebugTest.tsx**
```tsx
import { NetworkDebugTest } from './NetworkDebugTest';
<NetworkDebugTest />
```
- Shows current network value
- Shows network type and comparisons
- Helps identify if network context is working

### **3. BalanceRefreshDebugTest.tsx**
```tsx
import { BalanceRefreshDebugTest } from './BalanceRefreshDebugTest';
<BalanceRefreshDebugTest />
```
- Tests balance refresh with different networks
- Allows switching between testnet/mainnet
- Tests faucet and balance refresh together

## 🎯 **Expected Debug Output**

### **Correct Behavior:**
```
🧪 FAUCET DEBUG: Calling faucet for ETH on network testnet
🧪 BALANCE DEBUG: Network used: testnet
🧪 API DEBUG: getWalletBalances called with network: testnet
🧪 API DEBUG: Final endpoint: /wallets?network=testnet
```

### **Problem Behavior:**
```
🧪 FAUCET DEBUG: Calling faucet for ETH on network testnet
🧪 BALANCE DEBUG: Network used: mainnet  ← WRONG!
🧪 API DEBUG: getWalletBalances called with network: mainnet  ← WRONG!
🧪 API DEBUG: Final endpoint: /wallets?network=mainnet  ← WRONG!
```

## 🔧 **How to Debug**

### **Step 1: Add Debug Components**
Add these to your app temporarily:

```tsx
import { NetworkDebugTest } from './NetworkDebugTest';
import { BalanceRefreshDebugTest } from './BalanceRefreshDebugTest';

// In your app
<NetworkDebugTest />
<BalanceRefreshDebugTest />
```

### **Step 2: Check Network Context**
1. Look at `NetworkDebugTest` output
2. Verify network is set to `testnet` when in demo mode
3. If not, use the "Switch to Testnet" button

### **Step 3: Test Faucet + Balance**
1. Use `BalanceRefreshDebugTest`
2. Click "Test USDC Faucet"
3. Watch console logs for network consistency
4. Check if balance updates

### **Step 4: Check Console Logs**
Look for these patterns:

**✅ Good:**
```
🧪 BALANCE DEBUG: Network used: testnet
🧪 API DEBUG: Final endpoint: /wallets?network=testnet
```

**❌ Bad:**
```
🧪 BALANCE DEBUG: Network used: mainnet
🧪 API DEBUG: Final endpoint: /wallets?network=mainnet
```

## 🚨 **Common Issues**

### **Issue 1: Network Context Not Set**
- User hasn't switched to testnet mode
- Network context defaults to mainnet
- **Fix**: Use "Switch to Testnet" button

### **Issue 2: Network Context Not Working**
- NetworkContext not properly wrapped around app
- Network value is undefined or wrong type
- **Fix**: Check NetworkProvider setup

### **Issue 3: API Default Parameter**
- API method defaults to mainnet when network is undefined
- **Fix**: Ensure network parameter is always passed

## 🎉 **Expected Fix**

After debugging, you should see:

1. **✅ Network Context**: Shows `testnet` when in demo mode
2. **✅ API Calls**: All balance calls use `?network=testnet`
3. **✅ Balance Updates**: Balance refreshes after faucet
4. **✅ Consistent Data**: Same balance shown everywhere

## 📁 **Files to Copy**

Copy these debug components to your Lovable project:

```
lovable-files/NetworkDebugTest.tsx           ← Network debugging
lovable-files/BalanceRefreshDebugTest.tsx    ← Balance refresh debugging
lovable-files/WalletBalanceDropdown.tsx      ← Enhanced logging
lovable-files/api.ts                         ← Enhanced logging
```

The debug tools will help identify exactly where the network mismatch is occurring! 🧪
