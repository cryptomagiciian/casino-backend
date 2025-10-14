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
      
      // Simple approach: Always use testnet for demo mode
      const isDemoMode = localStorage.getItem('casino-demo-mode') === 'true';
      const data = isDemoMode 
        ? await apiService.getTestnetBalances()
        : await apiService.getWalletBalances();
      
      console.log('💰 BalanceContext: New balances received:', data);
      setBalances(data);
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
