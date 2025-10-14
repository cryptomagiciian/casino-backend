import React from 'react';
import { useNetwork } from './NetworkContext';

export const NetworkToggle: React.FC = () => {
  const { network, setNetwork, isMainnet, isTestnet } = useNetwork();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-400">Network:</span>
      <div className="flex bg-gray-800 rounded-lg p-1">
        <button
          onClick={() => setNetwork('mainnet')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isMainnet
              ? 'bg-green-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setNetwork('testnet')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            isTestnet
              ? 'bg-orange-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Demo
        </button>
      </div>
    </div>
  );
};
