import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiService } from './api';

interface WalletBalance {
  currency: string;
  available: string;
  locked: string;
  total: string;
}

interface BalanceContextType {
  balances: WalletBalance[];
  loading: boolean;
  refreshBalances: () => Promise<void>;
  getBalance: (currency: string) => number;
  getAvailableBalance: (currency: string) => number;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export const BalanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshBalances = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 BalanceContext: Refreshing balances...');
      
      // Try the main method first
      try {
        const data = await apiService.getWalletBalances();
        console.log('💰 BalanceContext: New balances received:', data);
        setBalances(data);
      } catch (error) {
        console.log('⚠️ Main method failed, trying testnet fallback...', error.message);
        
        // Fallback: Force testnet if demo mode is enabled
        if (localStorage.getItem('casino-demo-mode') === 'true') {
          console.log('🔄 Using testnet fallback for demo mode...');
          const testnetData = await apiService.getTestnetBalances();
          console.log('💰 BalanceContext: Testnet balances received:', testnetData);
          setBalances(testnetData);
        } else {
          throw error; // Re-throw if not in demo mode
        }
      }
    } catch (error) {
      console.error('❌ BalanceContext: Failed to refresh balances:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getBalance = useCallback((currency: string): number => {
    const wallet = balances.find(w => w.currency === currency);
    return wallet ? parseFloat(wallet.total) : 0;
  }, [balances]);

  const getAvailableBalance = useCallback((currency: string): number => {
    const wallet = balances.find(w => w.currency === currency);
    return wallet ? parseFloat(wallet.available) : 0;
  }, [balances]);

  return (
    <BalanceContext.Provider value={{
      balances,
      loading,
      refreshBalances,
      getBalance,
      getAvailableBalance,
    }}>
      {children}
    </BalanceContext.Provider>
  );
};

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
};
