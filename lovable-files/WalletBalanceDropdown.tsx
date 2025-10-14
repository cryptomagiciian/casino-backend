import React, { useState, useEffect, useRef } from 'react';
import { apiService } from './api';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';
import { useBalance } from './BalanceContext';

interface WalletBalanceDropdownProps {
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  onBalanceUpdate?: () => void;
}

interface WalletData {
  currency: string;
  available: string;
  locked: string;
  total: string;
}

export const WalletBalanceDropdown: React.FC<WalletBalanceDropdownProps> = ({ 
  className = '', 
  position = 'top-right',
  onBalanceUpdate
}) => {
  const { network } = useNetwork();
  const { displayCurrency, bettingCurrency, setBettingCurrency, formatBalance, convertToUsd } = useCurrency();
  const { balances: globalBalances, loading, refreshBalances } = useBalance();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchBalances = async () => {
    try {
      console.log(`🔄 Fetching wallet balances for ${network}...`);
      console.log('🧪 BALANCE DEBUG: Network type:', typeof network);
      console.log('🧪 BALANCE DEBUG: Network value:', JSON.stringify(network));
      console.log('🧪 BALANCE DEBUG: Network === "testnet":', network === 'testnet');
      console.log('🧪 BALANCE DEBUG: Network === "mainnet":', network === 'mainnet');
      console.log('🧪 BALANCE DEBUG: Component re-rendered with network:', network);
      
      // Use global balance context
      await refreshBalances();
      
      // Convert global balances to wallet data format
      const walletData = globalBalances.map(wallet => ({
        currency: wallet.currency,
        available: wallet.available,
        locked: wallet.locked,
        total: wallet.total
      }));
      
      console.log('💰 Wallet data received:', walletData);
      
      setWallets(walletData);
      setError(null);
      
      // Notify parent component that balances were updated
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
    } catch (err) {
      console.error('❌ Failed to fetch wallet balances:', err);
      setError('Failed to load balances');
    }
  };

  useEffect(() => {
    fetchBalances();
    
    // Refresh balances every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [network]); // Re-fetch when network changes

  // Sync with global balances when they change
  useEffect(() => {
    if (globalBalances.length > 0) {
      const walletData = globalBalances.map(wallet => ({
        currency: wallet.currency,
        available: wallet.available,
        locked: wallet.locked,
        total: wallet.total
      }));
      setWallets(walletData);
    }
  }, [globalBalances]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const getTotalBalance = () => {
    if (displayCurrency === 'usd') {
      const total = wallets.reduce((sum, wallet) => {
        const balance = parseFloat(wallet.available);
        const usdValue = convertToUsd(balance, wallet.currency);
        console.log(`💰 Balance calc: ${balance} ${wallet.currency} = $${usdValue} USD`);
        return sum + usdValue;
      }, 0);
      console.log(`💰 Total balance calculated: $${total.toFixed(2)}`);
      return total;
    } else {
      return wallets.reduce((sum, wallet) => sum + parseFloat(wallet.available), 0);
    }
  };

  const getTotalBalanceFormatted = () => {
    const total = getTotalBalance();
    if (displayCurrency === 'usd') {
      return `$${total.toFixed(2)}`;
    } else {
      return `${total.toFixed(2)}`;
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'BTC': return '₿';
      case 'ETH': return 'Ξ';
      case 'SOL': return '◎';
      case 'USDC': return '$';
      case 'USDT': return '$';
      default: return '₿';
    }
  };

  const handleCurrencySelect = (currency: string) => {
    setBettingCurrency(currency as any);
    setIsOpen(false);
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

  return (
    <div className={`fixed ${getPositionClasses()} z-50 ${className}`} ref={dropdownRef}>
      <div className="bg-gray-800/90 backdrop-blur-sm border border-purple-500/50 rounded-lg shadow-lg hover:bg-gray-700/90 transition-all duration-200">
        {/* Header */}
        <div 
          className="p-3 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
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
              onClick={(e) => {
                e.stopPropagation();
                fetchBalances();
              }}
              className="text-gray-400 hover:text-gray-300 text-xs"
              title="Refresh balances"
            >
              🔄
            </button>
          </div>
          
          {/* Total Balance */}
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">Total</span>
            <span className="text-lg font-mono font-bold text-purple-400">
              {getTotalBalanceFormatted()}
            </span>
            <span className={`text-xs transform transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}>
              ▼
            </span>
          </div>
        </div>

        {/* Dropdown Content */}
        {isOpen && (
          <div className="border-t border-gray-600">
            {/* Betting Currency Selection */}
            <div className="p-3 border-b border-gray-600">
              <div className="text-xs text-gray-400 mb-2">Select betting currency:</div>
              <div className="flex flex-wrap gap-1">
                {['BTC', 'ETH', 'SOL', 'USDC', 'USDT'].map((currency) => {
                  const wallet = wallets.find(w => w.currency === currency);
                  const balance = wallet ? parseFloat(wallet.available) : 0;
                  const isSelected = bettingCurrency === currency;
                  
                  return (
                    <button
                      key={currency}
                      onClick={() => handleCurrencySelect(currency)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                        isSelected
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                      }`}
                    >
                      <span>{getCurrencyIcon(currency)}</span>
                      <span>{currency}</span>
                      {balance > 0 && (
                        <span className="text-green-400">({balance.toFixed(2)})</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wallet Balances */}
            <div className="max-h-64 overflow-y-auto">
              {wallets.length > 0 ? (
                wallets.map((wallet) => {
                  const balance = parseFloat(wallet.available);
                  const locked = parseFloat(wallet.locked);
                  const total = parseFloat(wallet.total);
                  const isSelected = bettingCurrency === wallet.currency;
                  
                  return (
                    <div 
                      key={wallet.currency} 
                      className={`p-3 hover:bg-gray-700/50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-purple-600/10 border-l-2 border-purple-500' : ''
                      }`}
                      onClick={() => handleCurrencySelect(wallet.currency)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getCurrencyIcon(wallet.currency)}</span>
                          <span className="text-gray-400 text-xs font-mono">{wallet.currency}</span>
                          {isSelected && <span className="text-purple-400 text-xs">✓</span>}
                        </div>
                        <span className={`text-sm font-mono font-bold ${
                          balance > 0 ? 'text-green-400' : 'text-gray-500'
                        }`}>
                          {formatBalance(balance, wallet.currency)}
                        </span>
                      </div>
                      
                      {locked > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">Locked</span>
                          <span className="text-xs font-mono text-orange-400">
                            {formatBalance(locked, wallet.currency)}
                          </span>
                        </div>
                      )}
                      
                      {total !== balance && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">Total</span>
                          <span className="text-xs font-mono text-blue-400">
                            {formatBalance(total, wallet.currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-gray-500 text-xs">
                  No wallets found
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="border-t border-gray-600 p-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Network: {network}</span>
                <span>Display: {displayCurrency.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <span>Betting: {getCurrencyIcon(bettingCurrency)} {bettingCurrency}</span>
                <span>Click currency to select</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
