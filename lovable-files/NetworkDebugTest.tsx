import React from 'react';
import { useNetwork } from './NetworkContext';

export const NetworkDebugTest: React.FC = () => {
  const { network } = useNetwork();

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Network Debug Test</h3>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Network Value:</span>
          <span className="text-white font-mono">{JSON.stringify(network)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Network Type:</span>
          <span className="text-white font-mono">{typeof network}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Is Testnet:</span>
          <span className={`font-mono ${network === 'testnet' ? 'text-green-400' : 'text-red-400'}`}>
            {network === 'testnet' ? 'YES' : 'NO'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Is Mainnet:</span>
          <span className={`font-mono ${network === 'mainnet' ? 'text-green-400' : 'text-red-400'}`}>
            {network === 'mainnet' ? 'YES' : 'NO'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Expected for Demo:</span>
          <span className="text-yellow-400 font-mono">testnet</span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-700 rounded">
        <div className="text-xs text-gray-400 mb-2">Raw Network Object:</div>
        <pre className="text-xs text-gray-300 font-mono">
          {JSON.stringify({ network }, null, 2)}
        </pre>
      </div>
    </div>
  );
};
