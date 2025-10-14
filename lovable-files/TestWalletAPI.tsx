import React, { useState } from 'react';
import { apiService } from './api';
import { useNetwork } from './NetworkContext';

export const TestWalletAPI: React.FC = () => {
  const { network } = useNetwork();
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🧪 Testing wallet API for ${network}...`);
      const result = await apiService.getWalletBalances();
      console.log('🧪 API Response:', result);
      
      setBalances(result);
    } catch (err: any) {
      console.error('🧪 API Error:', err);
      setError(err.message || 'API Error');
    } finally {
      setLoading(false);
    }
  };

  const testFaucet = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🧪 Testing faucet API...');
      const result = await apiService.faucet('USDC');
      console.log('🧪 Faucet Response:', result);
      
      // Refresh balances after faucet
      setTimeout(() => testAPI(), 1000);
    } catch (err: any) {
      console.error('🧪 Faucet Error:', err);
      setError(err.message || 'Faucet Error');
    } finally {
      setLoading(false);
    }
  };

  const clearDemoFunds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🧪 Clearing demo funds...');
      const result = await apiService.clearDemoFunds();
      console.log('🧪 Clear Demo Funds Response:', result);
      
      // Refresh balances after clearing
      setTimeout(() => testAPI(), 1000);
    } catch (err: any) {
      console.error('🧪 Clear Demo Funds Error:', err);
      setError(err.message || 'Clear Demo Funds Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Wallet API Test</h3>
      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={testAPI}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
        >
          {loading ? 'Testing...' : 'Test Get Balances'}
        </button>
        
        {network === 'testnet' && (
          <button
            onClick={testFaucet}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded"
          >
            {loading ? 'Testing...' : 'Test Faucet'}
          </button>
        )}
        
        <button
          onClick={clearDemoFunds}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded"
        >
          {loading ? 'Clearing...' : 'Clear Demo Funds'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-400">
          ❌ {error}
        </div>
      )}

      {balances && (
        <div className="space-y-2">
          <h4 className="text-gray-300 font-medium">API Response:</h4>
          <pre className="bg-gray-900 p-3 rounded text-xs text-gray-300 overflow-auto">
            {JSON.stringify(balances, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
