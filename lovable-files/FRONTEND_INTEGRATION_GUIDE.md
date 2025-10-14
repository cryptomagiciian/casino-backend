# Frontend Integration Guide - Live/Demo Wallet System

## 🎯 Overview
This guide shows how to integrate the new live/demo wallet system into your Lovable frontend.

## 📁 Files to Add/Update

### 1. **New Files to Add** (Copy from lovable-files/)

```bash
# Copy these files to your Lovable project:
- NetworkContext.tsx
- NetworkToggle.tsx  
- TestnetFaucet.tsx
```

### 2. **Files to Update**

#### **A. Main App Component (App.tsx or main component)**

```tsx
import React from 'react';
import { NetworkProvider } from './NetworkContext';
// ... other imports

function App() {
  return (
    <NetworkProvider>
      {/* Your existing app content */}
      <YourMainAppContent />
    </NetworkProvider>
  );
}

export default App;
```

#### **B. Header/Navigation Component**

```tsx
import React from 'react';
import { NetworkToggle } from './NetworkToggle';
// ... other imports

export const Header = () => {
  return (
    <header className="...">
      {/* Your existing header content */}
      
      {/* Add network toggle */}
      <div className="flex items-center space-x-4">
        <NetworkToggle />
        {/* Other header items */}
      </div>
    </header>
  );
};
```

#### **C. Account/Wallet Page**

```tsx
import React from 'react';
import { TestnetFaucet } from './TestnetFaucet';
import { useNetwork } from './NetworkContext';
// ... other imports

export const AccountPage = () => {
  const { network } = useNetwork();

  return (
    <div className="...">
      {/* Your existing account content */}
      
      {/* Add testnet faucet */}
      {network === 'testnet' && (
        <div className="mb-6">
          <TestnetFaucet />
        </div>
      )}
    </div>
  );
};
```

#### **D. Game Components** (Update existing games)

```tsx
import React from 'react';
import { useNetwork } from './NetworkContext';
// ... other imports

export const YourGameComponent = () => {
  const { network, isMainnet, isTestnet } = useNetwork();

  // Use network in your game logic
  const handleBet = async () => {
    // Your betting logic here
    // The network context is available for any network-specific logic
  };

  return (
    <div className="...">
      {/* Show network indicator */}
      <div className={`mb-4 p-2 rounded ${
        isMainnet ? 'bg-green-900/20 border border-green-500/30' : 'bg-orange-900/20 border border-orange-500/30'
      }`}>
        <span className={`text-sm font-medium ${
          isMainnet ? 'text-green-400' : 'text-orange-400'
        }`}>
          {isMainnet ? '🟢 LIVE MODE' : '🟠 DEMO MODE'}
        </span>
      </div>
      
      {/* Your existing game content */}
    </div>
  );
};
```

#### **E. Deposit/Withdrawal Forms**

```tsx
import React from 'react';
import { useNetwork } from './NetworkContext';
// ... other imports

export const DepositForm = () => {
  const { network } = useNetwork();

  const handleDeposit = async (data) => {
    // Pass network to deposit creation
    const deposit = await apiService.createDeposit({
      ...data,
      network, // This will be used by the backend
    });
  };

  return (
    <div className="...">
      {/* Show current network */}
      <div className="mb-4">
        <span className="text-sm text-gray-400">
          Depositing to: <span className={`font-medium ${
            network === 'mainnet' ? 'text-green-400' : 'text-orange-400'
          }`}>
            {network === 'mainnet' ? 'LIVE (Mainnet)' : 'DEMO (Testnet)'}
          </span>
        </span>
      </div>
      
      {/* Your existing form content */}
    </div>
  );
};
```

## 🎨 UI Integration Examples

### **Network Toggle in Header**
```tsx
// Add to your header/navigation
<div className="flex items-center space-x-4">
  <NetworkToggle />
  <WalletBalance position="top-right" />
</div>
```

### **Network Indicator in Games**
```tsx
// Add to each game component
<div className={`mb-4 p-3 rounded-lg ${
  isMainnet 
    ? 'bg-green-900/20 border border-green-500/30' 
    : 'bg-orange-900/20 border border-orange-500/30'
}`}>
  <div className="flex items-center space-x-2">
    <div className={`w-2 h-2 rounded-full ${
      isMainnet ? 'bg-green-400' : 'bg-orange-400'
    }`}></div>
    <span className={`text-sm font-medium ${
      isMainnet ? 'text-green-400' : 'text-orange-400'
    }`}>
      {isMainnet ? 'LIVE MODE - Real Money' : 'DEMO MODE - Testnet Tokens'}
    </span>
  </div>
</div>
```

### **Testnet Faucet in Account Page**
```tsx
// Add to account/wallet page
{isTestnet && (
  <div className="mb-6">
    <TestnetFaucet />
  </div>
)}
```

## 🔧 API Integration

The `api.ts` file is already updated to support network parameters. Use it like this:

```tsx
import { apiService } from './api';
import { useNetwork } from './NetworkContext';

const { network } = useNetwork();

// Get balances for current network
const balances = await apiService.getWalletBalances(network);

// Create deposit with network
const deposit = await apiService.createDeposit({
  currency: 'USDC',
  amount: 100,
  network, // Will be 'mainnet' or 'testnet'
});
```

## 🎯 Key Integration Points

1. **Wrap App with NetworkProvider** - Enables network context throughout app
2. **Add NetworkToggle to Header** - Allows users to switch modes
3. **Update WalletBalance** - Already updated, shows network-specific balances
4. **Add TestnetFaucet to Account Page** - Only visible on testnet
5. **Update Game Components** - Show network indicators and use network context
6. **Update Deposit/Withdrawal Forms** - Pass network parameter to API

## 🚀 Benefits After Integration

- ✅ Users can toggle between Live (mainnet) and Demo (testnet) modes
- ✅ Separate balances for each network
- ✅ Free testnet tokens for testing games
- ✅ Real crypto deposits on mainnet
- ✅ Visual indicators show current mode
- ✅ Network preference saved in browser

## 📝 Notes

- The `api.ts` and `WalletBalance.tsx` files are already updated
- Copy the 3 new files from `lovable-files/` to your project
- Update your existing components to use the `useNetwork()` hook
- The backend is already deployed and ready to handle network-specific requests
