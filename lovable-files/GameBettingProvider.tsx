import React, { createContext, useState, useContext, ReactNode } from 'react';
import { apiService } from './api';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { useBalance } from './BalanceContext';

interface BettingContextType {
  placeBet: (gameData: {
    game: string;
    stake: number;
    currency: string;
    prediction?: any; // Game-specific prediction data
    meta?: any; // Additional metadata (stored in params)
  }) => Promise<any>;
  resolveBet: (betId: string) => Promise<any>;
  cashoutBet: (betId: string, multiplier?: number) => Promise<any>;
  getBalance: (currency: string) => Promise<number>;
  isBetting: boolean;
  error: string | null;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

export const GameBettingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { network } = useNetwork();
  const { bettingCurrency, convertToUsd } = useCurrency();
  const { refreshBalances, getAvailableBalance } = useBalance();
  const [isBetting, setIsBetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const placeBet = async (gameData: {
    game: string;
    stake: number;
    currency: string;
    prediction?: any;
    meta?: any;
  }) => {
    try {
      setIsBetting(true);
      setError(null);

      // Use the selected betting currency
      let actualStake = gameData.stake;
      let actualCurrency = bettingCurrency;

      // If betting in USD, convert to the selected crypto currency
      if (gameData.currency === 'USD') {
        actualCurrency = bettingCurrency;
        actualStake = gameData.stake; // For stablecoins, 1 USD = 1 USDC/USDT
      }

      const betData = {
        game: gameData.game,
        stake: actualStake.toString(),
        currency: actualCurrency,
        clientSeed: Math.random().toString(36), // Generate client seed for provably fair
        params: {
          ...gameData.prediction,
          // Store meta data in params since backend doesn't accept meta
          network,
          originalCurrency: gameData.currency,
          originalStake: gameData.stake,
          ...gameData.meta,
        },
      };

      console.log('🎰 Placing bet:', betData);
      const result = await apiService.placeBet(betData);
      console.log('🎰 Bet placed successfully:', result);
      
      return result;
    } catch (err: any) {
      console.error('🎰 Bet placement failed:', err);
      setError(err.message || 'Failed to place bet');
      throw err;
    } finally {
      setIsBetting(false);
    }
  };

  const resolveBet = async (betId: string) => {
    try {
      setIsBetting(true);
      setError(null);

      console.log('🎰 Resolving bet:', betId);
      const result = await apiService.resolveBet(betId);
      console.log('🎰 Bet resolved successfully:', result);
      
      // Refresh balances after bet resolution to show updated amounts
      console.log('🔄 Refreshing balances after bet resolution...');
      await refreshBalances();
      
      return result;
    } catch (err: any) {
      console.error('🎰 Bet resolution failed:', err);
      setError(err.message || 'Failed to resolve bet');
      throw err;
    } finally {
      setIsBetting(false);
    }
  };

  const cashoutBet = async (betId: string, multiplier?: number) => {
    try {
      setIsBetting(true);
      setError(null);

      console.log('🎰 Cashing out bet:', betId, 'multiplier:', multiplier);
      const result = await apiService.cashoutBet(betId, multiplier);
      console.log('🎰 Bet cashed out successfully:', result);
      
      // Refresh balances after cashout to show updated amounts
      console.log('🔄 Refreshing balances after cashout...');
      await refreshBalances();
      
      return result;
    } catch (err: any) {
      console.error('🎰 Bet cashout failed:', err);
      setError(err.message || 'Failed to cash out bet');
      throw err;
    } finally {
      setIsBetting(false);
    }
  };

  const getBalance = async (currency?: string): Promise<number> => {
    try {
      const targetCurrency = currency || bettingCurrency;
      // First read from global cache
      let amount = getAvailableBalance(targetCurrency);
      if (!amount || Number.isNaN(amount)) {
        // Force refresh, then read again
        await refreshBalances();
        amount = getAvailableBalance(targetCurrency);
      }
      return amount || 0;
    } catch (err) {
      console.error('Failed to get balance:', err);
      return 0;
    }
  };

  return (
    <BettingContext.Provider value={{
      placeBet,
      resolveBet,
      cashoutBet,
      getBalance,
      isBetting,
      error,
    }}>
      {children}
    </BettingContext.Provider>
  );
};

export const useBetting = () => {
  const context = useContext(BettingContext);
  if (context === undefined) {
    throw new Error('useBetting must be used within a GameBettingProvider');
  }
  return context;
};
