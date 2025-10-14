import React, { useState } from 'react';
import { apiService } from './api';
import { useNetwork } from './NetworkContext';

export const BalanceTest: React.FC = () => {
  const { network } = useNetwork();
  const [balances, setBalances] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testBalance = async () => {
    try {
      setLoading(true);
      console.log('🧪 Testing balance fetch...');
      const result = await apiService.getWalletBalances();
      console.log('🧪 Balance result:', result);
      setBalances(result);
    } catch (error) {
      console.error('🧪 Balance error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testFaucet = async () => {
    try {
      setLoading(true);
      console.log('🧪 Testing faucet...');
      const result = await apiService.faucet('USDC');
      console.log('🧪 Faucet result:', result);
      
      // Wait a moment then refresh balance
      setTimeout(() => {
        testBalance();
      }, 1000);
    } catch (error) {
      console.error('🧪 Faucet error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Balance & Faucet Test</h3>
      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={testBalance}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
        >
          {loading ? 'Testing...' : 'Test Balance'}
        </button>
        
        {network === 'testnet' && (
          <button
            onClick={testFaucet}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded"
          >
            {loading ? 'Testing...' : 'Test Faucet + Balance'}
          </button>
        )}
      </div>

      {balances && (
        <div className="bg-gray-700/50 p-3 rounded text-gray-200 text-sm font-mono">
          <div className="mb-2 font-bold">Current Balances ({network}):</div>
          {balances.map((wallet: any, index: number) => (
            <div key={index} className="flex justify-between">
              <span>{wallet.currency}:</span>
              <span className="text-green-400">{wallet.available}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
