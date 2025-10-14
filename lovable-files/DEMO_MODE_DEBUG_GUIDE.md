# 🔍 Demo Mode Debug Guide

## ❌ **Problem**
User is in demo mode but balance API calls are still going to `mainnet` instead of `testnet`.

## 🔍 **Possible Causes**

### **1. NetworkContext Not Wrapped**
The app might not be wrapped with `NetworkProvider`, causing the context to fail.

### **2. Multiple NetworkContext Instances**
There might be multiple instances of the context, causing confusion.

### **3. NetworkContext Not Updated**
The network state might not be properly updating when switching to demo mode.

### **4. Component Not Re-rendering**
The `WalletBalanceDropdown` component might not be re-rendering when network changes.

## 🧪 **Debug Tools Created**

### **1. NetworkContextDebugTest.tsx**
```tsx
import { NetworkContextDebugTest } from './NetworkContextDebugTest';
<NetworkContextDebugTest />
```
- Shows current network context values
- Shows localStorage values
- Allows manual network switching
- Helps identify context issues

### **2. NetworkIntegrationTest.tsx**
```tsx
import { NetworkIntegrationTest } from './NetworkIntegrationTest';
<NetworkIntegrationTest />
```
- Tests if NetworkContext is properly integrated
- Shows error if context is not wrapped
- Displays current network values

### **3. Enhanced WalletBalanceDropdown Logging**
Added detailed logging to show:
- Network value and type
- Component re-render status
- Target network being used

## 🎯 **How to Debug**

### **Step 1: Add Debug Components**
Add these to your app temporarily:

```tsx
import { NetworkContextDebugTest } from './NetworkContextDebugTest';
import { NetworkIntegrationTest } from './NetworkIntegrationTest';

// In your app
<NetworkIntegrationTest />
<NetworkContextDebugTest />
```

### **Step 2: Check Network Context**
1. Look at `NetworkIntegrationTest` output
2. If it shows an error, the app is not wrapped with `NetworkProvider`
3. If it shows network values, check if they're correct

### **Step 3: Check Network Values**
1. Look at `NetworkContextDebugTest` output
2. Verify network is set to `"testnet"`
3. Check localStorage value
4. Try manually switching networks

### **Step 4: Check Console Logs**
Look for these patterns in the console:

**✅ Good:**
```
🧪 BALANCE DEBUG: Network value: "testnet"
🧪 BALANCE DEBUG: Network === "testnet": true
🧪 BALANCE DEBUG: Using target network: testnet
```

**❌ Bad:**
```
🧪 BALANCE DEBUG: Network value: "mainnet"
🧪 BALANCE DEBUG: Network === "testnet": false
🧪 BALANCE DEBUG: Using target network: mainnet
```

## 🔧 **Common Fixes**

### **Fix 1: Wrap App with NetworkProvider**
```tsx
import { NetworkProvider } from './NetworkContext';

function App() {
  return (
    <NetworkProvider>
      <YourAppContent />
    </NetworkProvider>
  );
}
```

### **Fix 2: Add Network Toggle**
```tsx
import { NetworkToggle } from './NetworkToggle';

// In your header
<NetworkToggle />
```

### **Fix 3: Check localStorage**
The network preference is stored in `localStorage.getItem('casino-network')`. Check if it's set to `"testnet"`.

### **Fix 4: Force Network Switch**
If the context is not updating, try:
```tsx
const { setNetwork } = useNetwork();
setNetwork('testnet');
```

## 🎯 **Expected Results**

After debugging, you should see:

1. **✅ NetworkContext Working**: No context errors
2. **✅ Network Set to Testnet**: `network === "testnet"`
3. **✅ Balance API Calls Testnet**: `/wallets?network=testnet`
4. **✅ Balance Updates**: Real-time balance updates after faucet

## 📁 **Files to Copy**

Copy these debug components to your Lovable project:

```
lovable-files/NetworkContextDebugTest.tsx    ← Network context debugging
lovable-files/NetworkIntegrationTest.tsx     ← Integration testing
lovable-files/WalletBalanceDropdown.tsx      ← Enhanced logging
```

## 🚨 **If Issue Persists**

If the debug tools show that the network context is working correctly but the balance API calls are still going to mainnet, there might be:

1. **Caching Issue**: The component might be using cached network value
2. **Timing Issue**: The network change might not be reflected immediately
3. **Multiple Components**: Different components might be using different network values

The debug tools will help identify the exact issue! 🧪
