import { useState, useEffect } from 'react';
import { apiService } from './api';

interface WalletBalance {
  currency: string;
  available: string;
  locked: string;
  total: string;
}

export const useWallet = () => {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    setLoading(true);
    try {
      const data = await apiService.getWalletBalances();
      setBalances(data);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const faucet = async (currency: string) => {
    try {
      await apiService.faucet(currency);
      await fetchBalances(); // Refresh balances
    } catch (error) {
      console.error('Faucet failed:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  return {
    balances,
    loading,
    fetchBalances,
    faucet,
  };
};
