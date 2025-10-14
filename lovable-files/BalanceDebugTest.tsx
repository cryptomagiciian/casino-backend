import React, { useState, useEffect } from 'react';
import { apiService } from './api';
import { useNetwork } from './NetworkContext';

export const BalanceDebugTest: React.FC = () => {
  const { network } = useNetwork();
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🧪 BALANCE DEBUG: Fetching balances for network: ${network}`);
      
      // Fetch both detailed and regular balances
      const regularBalances = await apiService.getWalletBalances();
      const detailedBalances = await apiService.getWalletBalances(undefined, true);
      
      console.log('🧪 BALANCE DEBUG: Regular balances:', regularBalances);
      console.log('🧪 BALANCE DEBUG: Detailed balances:', detailedBalances);
      
      setBalances({
        regular: regularBalances,
        detailed: detailedBalances,
        network,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('🧪 BALANCE DEBUG: Error:', err);
      setError(err.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [network]);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Balance Debug Test</h3>
      
      <div className="mb-4 p-3 bg-gray-700 rounded-lg">
        <div className="text-sm text-gray-300 mb-2">
          <strong>Current Network:</strong> {network}
        </div>
        <div className="text-sm text-gray-300 mb-2">
          <strong>Timestamp:</strong> {balances?.timestamp || 'Not loaded'}
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
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-400">
          ❌ {error}
        </div>
      )}

      {balances && (
        <div className="space-y-4">
          <div className="bg-gray-700/50 p-3 rounded text-gray-200 text-sm font-mono">
            <h4 className="font-bold mb-2 text-green-400">Regular Balances ({network}):</h4>
            <pre>{JSON.stringify(balances.regular, null, 2)}</pre>
          </div>
          
          <div className="bg-gray-700/50 p-3 rounded text-gray-200 text-sm font-mono">
            <h4 className="font-bold mb-2 text-blue-400">Detailed Balances ({network}):</h4>
            <pre>{JSON.stringify(balances.detailed, null, 2)}</pre>
          </div>
          
          <div className="bg-gray-700/50 p-3 rounded text-gray-200 text-sm">
            <h4 className="font-bold mb-2 text-yellow-400">Analysis:</h4>
            <div className="space-y-1">
              {balances.regular?.map((wallet: any) => (
                <div key={wallet.currency} className="flex justify-between">
                  <span>{wallet.currency}:</span>
                  <span className={parseFloat(wallet.available) < 0 ? 'text-red-400' : 'text-green-400'}>
                    Available: {wallet.available} | Total: {wallet.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
