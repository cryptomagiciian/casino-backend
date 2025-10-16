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
  resolveBet: (betId: string, resolveParams?: any) => Promise<any>;
  cashoutBet: (betId: string, multiplier?: number) => Promise<any>;
  getBalance: (currency: string) => Promise<number>;
  isBetting: boolean;
  error: string | null;
}

const BettingContext = createContext<BettingContextType | undefined>(undefined);

export const GameBettingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { network } = useNetwork();
  const { bettingCurrency, convertToUsd, convertUsdToCrypto } = useCurrency();
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

      // Always place bets in USD - no conversion needed
      const usdStake = gameData.stake; // Stake is always in USD
      
      const betData = {
        game: gameData.game,
        stake: usdStake.toString(), // Send USD amount to backend
        currency: 'USD', // Always use USD for betting
        clientSeed: Math.random().toString(36), // Generate client seed for provably fair
        params: {
          ...gameData.prediction,
          // Store meta data in params since backend doesn't accept meta
          network,
          displayCurrency: bettingCurrency, // Store selected currency for display only
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


  const resolveBet = async (betId: string, resolveParams?: any) => {
    try {
      setIsBetting(true);
      setError(null);

      console.log('🎰 Resolving bet:', betId, resolveParams ? `with params: ${JSON.stringify(resolveParams)}` : '');
      const result = await apiService.resolveBet(betId, resolveParams);
      console.log('🎰 Bet resolved successfully:', result);
      
      // Refresh balances after bet resolution to show updated amounts
      console.log('🔄 Refreshing balances after bet resolution...');
      // Use setTimeout to avoid updating state during render
      setTimeout(() => {
        refreshBalances();
      }, 0);
      
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
      // Use setTimeout to avoid updating state during render
      setTimeout(() => {
        refreshBalances();
      }, 0);
      
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
      let cryptoAmount = getAvailableBalance(targetCurrency);
      if (!cryptoAmount || Number.isNaN(cryptoAmount)) {
        // Force refresh, then read again
        await refreshBalances();
        cryptoAmount = getAvailableBalance(targetCurrency);
      }
      
      // Convert crypto amount to USD for comparison with USD stakes
      const usdAmount = convertToUsd(cryptoAmount, targetCurrency);
      console.log(`💰 Balance check: ${cryptoAmount} ${targetCurrency} = $${usdAmount} USD`);
      
      return usdAmount || 0;
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
