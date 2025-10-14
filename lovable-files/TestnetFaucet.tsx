import React, { useState } from 'react';
import { apiService } from './api';
import { useNetwork } from './NetworkContext';

interface TestnetFaucetProps {
  className?: string;
}

export const TestnetFaucet: React.FC<TestnetFaucetProps> = ({ className = '' }) => {
  const { network } = useNetwork();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const currencies = [
    { symbol: 'BTC', name: 'Bitcoin', amount: '0.001' },
    { symbol: 'ETH', name: 'Ethereum', amount: '0.01' },
    { symbol: 'SOL', name: 'Solana', amount: '0.1' },
    { symbol: 'USDC', name: 'USD Coin', amount: '10' },
    { symbol: 'USDT', name: 'Tether', amount: '10' },
  ];

  const handleFaucet = async (currency: string, amount: string) => {
    if (network !== 'testnet') {
      setMessage('Faucet is only available on testnet');
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      
      const result = await apiService.faucet(currency, amount);
      setMessage(`✅ Received ${amount} ${currency} from testnet faucet!`);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } catch (error: any) {
      console.error('Faucet error:', error);
      setMessage(`❌ Failed to get ${currency}: ${error.message || 'Unknown error'}`);
      
      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (network !== 'testnet') {
    return null; // Only show on testnet
  }

  return (
    <div className={`bg-orange-900/20 border border-orange-500/30 rounded-lg p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
        <h3 className="text-orange-400 font-semibold">Testnet Faucet</h3>
      </div>
      
      <p className="text-gray-400 text-sm mb-4">
        Get free testnet tokens to try out the games without risking real money.
      </p>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.includes('✅') 
            ? 'bg-green-900/30 border border-green-500/30 text-green-400'
            : 'bg-red-900/30 border border-red-500/30 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {currencies.map((currency) => (
          <button
            key={currency.symbol}
            onClick={() => handleFaucet(currency.symbol, currency.amount)}
            disabled={loading}
            className="flex items-center justify-between p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="text-left">
              <div className="text-white font-medium">{currency.symbol}</div>
              <div className="text-gray-400 text-xs">{currency.name}</div>
            </div>
            <div className="text-right">
              <div className="text-orange-400 font-mono text-sm">{currency.amount}</div>
              {loading && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-400 mt-1"></div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
