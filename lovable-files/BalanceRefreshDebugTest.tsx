import React, { useState, useEffect } from 'react';
import { apiService } from './api';
import { useNetwork } from './NetworkContext';

export const BalanceRefreshDebugTest: React.FC = () => {
  const { network, setNetwork } = useNetwork();
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faucetResult, setFaucetResult] = useState<any>(null);

  const fetchBalances = async (networkToUse?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const targetNetwork = networkToUse || network;
      console.log(`🧪 BALANCE REFRESH DEBUG: Fetching balances for network: ${targetNetwork}`);
      
      const result = await apiService.getWalletBalances();
      console.log('🧪 BALANCE REFRESH DEBUG: Balance response:', result);
      setBalances(result);
    } catch (err: any) {
      console.error('🧪 BALANCE REFRESH DEBUG: Error:', err);
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  const testFaucet = async (currency: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🧪 BALANCE REFRESH DEBUG: Testing faucet for ${currency} on ${network}`);
      const result = await apiService.faucet(currency);
      console.log('🧪 BALANCE REFRESH DEBUG: Faucet response:', result);
      setFaucetResult(result);
      
      // Test balance refresh with different approaches
      console.log('🧪 BALANCE REFRESH DEBUG: Testing balance refresh...');
      
      // 1. Immediate refresh with current network
      await fetchBalances();
      
      // 2. Refresh with auto-detection
      setTimeout(async () => {
        console.log('🧪 BALANCE REFRESH DEBUG: Refreshing with auto-detection...');
        await fetchBalances();
      }, 1000);
      
      // 3. Final refresh with auto-detection
      setTimeout(async () => {
        console.log('🧪 BALANCE REFRESH DEBUG: Final refresh with auto-detection...');
        await fetchBalances();
      }, 2000);
      
    } catch (err: any) {
      console.error('🧪 BALANCE REFRESH DEBUG: Faucet error:', err);
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
      <h3 className="text-white font-semibold mb-4">🧪 Balance Refresh Debug Test</h3>
      
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-300 mb-2">
          <strong>Current Network:</strong> {network}
        </div>
        <div className="text-sm text-gray-300 mb-2">
          <strong>Network Type:</strong> {typeof network}
        </div>
        <div className="text-sm text-gray-300 mb-2">
          <strong>Is Testnet:</strong> {network === 'testnet' ? '✅ Yes' : '❌ No'}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setNetwork('testnet')}
          className={`px-3 py-1 rounded text-sm ${
            network === 'testnet' 
              ? 'bg-orange-600 text-white' 
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          Switch to Testnet
        </button>
        
        <button
          onClick={() => setNetwork('mainnet')}
          className={`px-3 py-1 rounded text-sm ${
            network === 'mainnet' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          Switch to Mainnet
        </button>
        
        <button
          onClick={() => fetchBalances()}
          disabled={loading}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded text-sm"
        >
          {loading ? 'Loading...' : 'Refresh Balances'}
        </button>
        
        <button
          onClick={() => testFaucet('USDC')}
          disabled={loading || network !== 'testnet'}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded text-sm"
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
