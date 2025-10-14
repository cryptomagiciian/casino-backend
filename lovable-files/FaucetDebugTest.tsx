import React, { useState, useEffect } from 'react';
import { apiService } from './api';
import { useNetwork } from './NetworkContext';

export const FaucetDebugTest: React.FC = () => {
  const { network } = useNetwork();
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faucetResult, setFaucetResult] = useState<any>(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🧪 DEBUG: Fetching balances for network: ${network}`);
      const result = await apiService.getWalletBalances();
      console.log('🧪 DEBUG: Balance response:', result);
      setBalances(result);
    } catch (err: any) {
      console.error('🧪 DEBUG: Balance fetch error:', err);
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  const testFaucet = async (currency: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🧪 DEBUG: Testing faucet for ${currency} on ${network}`);
      const result = await apiService.faucet(currency);
      console.log('🧪 DEBUG: Faucet response:', result);
      setFaucetResult(result);
      
      // Wait a moment then refresh balances
      setTimeout(() => {
        console.log('🧪 DEBUG: Refreshing balances after faucet...');
        fetchBalances();
      }, 1000);
      
    } catch (err: any) {
      console.error('🧪 DEBUG: Faucet error:', err);
      setError(err.message || 'Faucet failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [network]);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Faucet Debug Test</h3>
      
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-300 mb-2">
          <strong>Current Network:</strong> {network}
        </div>
        <div className="text-sm text-gray-300 mb-2">
          <strong>Expected Faucet Network:</strong> testnet
        </div>
        <div className="text-sm text-gray-300">
          <strong>Network Match:</strong> {network === 'testnet' ? '✅ Yes' : '❌ No'}
        </div>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={fetchBalances}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
        >
          {loading ? 'Loading...' : 'Refresh Balances'}
        </button>
        
        <button
          onClick={() => testFaucet('USDC')}
          disabled={loading || network !== 'testnet'}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded"
        >
          {loading ? 'Testing...' : 'Test USDC Faucet'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-400">
          ❌ {error}
        </div>
      )}

      {faucetResult && (
        <div className="mb-4 p-3 bg-green-900/30 border border-green-500/30 rounded text-green-400">
          ✅ Faucet Result: {JSON.stringify(faucetResult, null, 2)}
        </div>
      )}

      {balances && (
        <div className="bg-gray-700/50 p-3 rounded text-gray-200 text-sm font-mono">
          <h4 className="font-bold mb-2">Current Balances ({network}):</h4>
          <pre>{JSON.stringify(balances, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
