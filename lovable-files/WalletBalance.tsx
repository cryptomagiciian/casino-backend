import React, { useState, useEffect } from 'react';
import { apiService } from './api';
import { notificationService } from './NotificationService';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencyToggle';

interface WalletBalanceProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onBalanceUpdate?: () => void; // Callback when balances are updated
}

export const WalletBalance: React.FC<WalletBalanceProps> = ({ 
  className = '', 
  position = 'top-right',
  onBalanceUpdate
}) => {
  const { network } = useNetwork();
  const { displayCurrency, formatBalance, convertToUsd } = useCurrency();
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      console.log(`🔄 Fetching wallet balances for ${network}...`);
      const wallets = await apiService.getWalletBalances(network);
      console.log('💰 Wallet data received:', wallets);
      
      // Convert to a simple balance object
      const balanceObj: Record<string, number> = {};
      wallets.forEach(wallet => {
        balanceObj[wallet.currency] = parseFloat(wallet.available);
      });
      
      console.log('💰 Processed balances:', balanceObj);
      setBalances(balanceObj);
      setError(null);
      
      // Notify parent component that balances were updated
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
    } catch (err) {
      console.error('❌ Failed to fetch wallet balances:', err);
      setError('Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    
    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    
    // Subscribe to notification service for real-time updates
    const unsubscribe = notificationService.subscribe((notifications) => {
      // Check if there are any new deposit/withdrawal notifications
      const hasNewTransactions = notifications.some(n => 
        (n.type === 'deposit' || n.type === 'withdrawal') && 
        !n.read && 
        new Date(n.timestamp) > new Date(Date.now() - 60000) // Last minute
      );
      
      if (hasNewTransactions) {
        // Refresh balances when new transactions are detected
        fetchBalances();
      }
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [network]); // Re-fetch when network changes

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (loading) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
        <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-600 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
            <span className="text-gray-300 text-sm">Loading wallet...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
        <div className="bg-red-800/90 backdrop-blur-sm border border-red-600 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-300 text-sm">⚠️ {error}</span>
            <button 
              onClick={fetchBalances}
              className="text-red-400 hover:text-red-300 text-xs underline"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalBalance = displayCurrency === 'usd' 
    ? Object.entries(balances).reduce((sum, [currency, balance]) => sum + convertToUsd(balance, currency), 0)
    : Object.values(balances).reduce((sum, balance) => sum + balance, 0);

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`}>
      <div className="bg-gray-800/90 backdrop-blur-sm border border-purple-500/50 rounded-lg p-3 shadow-lg hover:bg-gray-700/90 transition-all duration-200">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            network === 'mainnet' ? 'bg-green-400' : 'bg-orange-400'
          }`}></div>
          <span className="text-gray-300 text-sm font-medium">Wallet</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            network === 'mainnet' 
              ? 'bg-green-600/20 text-green-400' 
              : 'bg-orange-600/20 text-orange-400'
          }`}>
            {network === 'mainnet' ? 'LIVE' : 'DEMO'}
          </span>
          <button 
            onClick={fetchBalances}
            className="text-gray-400 hover:text-gray-300 text-xs"
            title="Refresh balances"
          >
            🔄
          </button>
        </div>
        
        <div className="space-y-1">
          {Object.keys(balances).length > 0 ? (
            Object.entries(balances).map(([currency, balance]) => (
              <div key={currency} className="flex items-center justify-between">
                <span className="text-gray-400 text-xs font-mono">
                  {displayCurrency === 'usd' ? currency : currency}
                </span>
                <span className={`text-sm font-mono font-bold ${
                  balance > 0 ? 'text-green-400' : 'text-gray-500'
                }`}>
                  {formatBalance(balance, currency)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 text-xs">
              No wallets found
            </div>
          )}
        </div>
        
        {Object.keys(balances).length > 1 && (
          <div className="border-t border-gray-600 mt-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs font-mono">Total</span>
              <span className="text-sm font-mono font-bold text-purple-400">
                {displayCurrency === 'usd' ? `$${totalBalance.toFixed(2)}` : totalBalance.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};