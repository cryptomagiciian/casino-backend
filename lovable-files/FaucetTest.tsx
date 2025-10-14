import React, { useState } from 'react';
import { apiService } from './api';

export const FaucetTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testFaucet = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      console.log('🧪 Testing faucet API...');
      const response = await apiService.faucet('USDC');
      console.log('🧪 Faucet response:', response);
      
      setResult(response);
    } catch (err: any) {
      console.error('🧪 Faucet error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Faucet API Test</h3>
      
      <button
        onClick={testFaucet}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test Faucet (USDC)'}
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded text-red-400">
          ❌ Error: {error}
        </div>
      )}

      {result && (
        <div className="bg-gray-700/50 p-3 rounded text-gray-200 text-sm font-mono">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
