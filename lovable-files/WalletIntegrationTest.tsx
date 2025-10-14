import React, { useState } from 'react';
import { useBetting } from './GameBettingProvider';
import { useNetwork } from './NetworkContext';
import { useCurrency } from './CurrencySelector';

export const WalletIntegrationTest: React.FC = () => {
  const { placeBet, getBalance, isBetting, error } = useBetting();
  const { network } = useNetwork();
  const { bettingCurrency, displayCurrency, formatBalance } = useCurrency();
  
  const [balance, setBalance] = useState<number>(0);
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBalance = async () => {
    try {
      setLoading(true);
      const currentBalance = await getBalance(bettingCurrency);
      setBalance(currentBalance);
      setTestResult(`✅ Balance: ${formatBalance(currentBalance, bettingCurrency)}`);
    } catch (error) {
      setTestResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testBet = async () => {
    try {
      setLoading(true);
      setTestResult('🎰 Placing test bet...');
      
      const betResult = await placeBet({
        game: 'test_game',
        stake: 1, // Small test bet
        currency: displayCurrency === 'usd' ? 'USD' : bettingCurrency,
        prediction: { test: true },
        meta: {
          network,
          displayCurrency,
          bettingCurrency,
          timestamp: Date.now(),
        },
      });
      
      setTestResult(`✅ Bet placed: ${betResult.id}`);
      
      // Check balance after bet
      setTimeout(async () => {
        const newBalance = await getBalance(bettingCurrency);
        setBalance(newBalance);
        setTestResult(prev => prev + ` | New Balance: ${formatBalance(newBalance, bettingCurrency)}`);
      }, 1000);
      
    } catch (error: any) {
      setTestResult(`❌ Bet failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Wallet Integration Test</h3>
      
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Network:</span>
            <span className="ml-2 text-white">{network}</span>
          </div>
          <div>
            <span className="text-gray-400">Currency:</span>
            <span className="ml-2 text-white">{bettingCurrency}</span>
          </div>
          <div>
            <span className="text-gray-400">Display:</span>
            <span className="ml-2 text-white">{displayCurrency}</span>
          </div>
          <div>
            <span className="text-gray-400">Balance:</span>
            <span className="ml-2 text-green-400 font-mono">
              {formatBalance(balance, bettingCurrency)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={testBalance}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
        >
          {loading ? 'Testing...' : 'Test Balance'}
        </button>
        
        <button
          onClick={testBet}
          disabled={loading || balance < 1}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded"
        >
          {loading ? 'Testing...' : 'Test Bet (1 unit)'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-400">
          ❌ {error}
        </div>
      )}

      {testResult && (
        <div className="p-3 bg-gray-700/50 rounded text-gray-200 text-sm font-mono">
          {testResult}
        </div>
      )}
    </div>
  );
};
