import React from 'react';
import { useWallet } from '../hooks/useWallet';

export const WalletBalance: React.FC = () => {
  const { balances, loading, faucet } = useWallet();

  const handleFaucet = async () => {
    try {
      await faucet('USDC', '1000.00');
      alert('Successfully received 1000 USDC from faucet! 💰');
    } catch (error) {
      alert('Faucet failed: ' + (error as Error).message);
    }
  };

  const usdcBalance = balances.find(b => b.currency === 'USDC');

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-yellow-400 mb-4">💰 Wallet</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">USDC Balance:</span>
          <span className="text-green-400 font-bold text-lg">
            {usdcBalance?.available || '0'} USDC
          </span>
        </div>
        
        <button
          onClick={handleFaucet}
          className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-bold transition-colors"
        >
          🚰 Get Demo Funds (1000 USDC)
        </button>
      </div>
    </div>
  );
};
