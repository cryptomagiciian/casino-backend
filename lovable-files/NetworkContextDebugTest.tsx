import React, { useState, useEffect } from 'react';
import { useNetwork } from './NetworkContext';

export const NetworkContextDebugTest: React.FC = () => {
  const { network, setNetwork, isMainnet, isTestnet } = useNetwork();
  const [localStorageValue, setLocalStorageValue] = useState<string | null>(null);

  useEffect(() => {
    // Check what's actually in localStorage
    const saved = localStorage.getItem('casino-network');
    setLocalStorageValue(saved);
  }, []);

  const handleSetTestnet = () => {
    console.log('🧪 NETWORK DEBUG: Setting network to testnet');
    setNetwork('testnet');
    // Check localStorage after setting
    setTimeout(() => {
      const newValue = localStorage.getItem('casino-network');
      console.log('🧪 NETWORK DEBUG: localStorage after set:', newValue);
      setLocalStorageValue(newValue);
    }, 100);
  };

  const handleSetMainnet = () => {
    console.log('🧪 NETWORK DEBUG: Setting network to mainnet');
    setNetwork('mainnet');
    // Check localStorage after setting
    setTimeout(() => {
      const newValue = localStorage.getItem('casino-network');
      console.log('🧪 NETWORK DEBUG: localStorage after set:', newValue);
      setLocalStorageValue(newValue);
    }, 100);
  };

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Network Context Debug Test</h3>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400 mb-2">Network Context Values:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>network:</span>
                <span className="font-mono text-white">{JSON.stringify(network)}</span>
              </div>
              <div className="flex justify-between">
                <span>isMainnet:</span>
                <span className={`font-mono ${isMainnet ? 'text-green-400' : 'text-red-400'}`}>
                  {isMainnet ? 'true' : 'false'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>isTestnet:</span>
                <span className={`font-mono ${isTestnet ? 'text-green-400' : 'text-red-400'}`}>
                  {isTestnet ? 'true' : 'false'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 p-3 rounded">
            <div className="text-gray-400 mb-2">LocalStorage Values:</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>casino-network:</span>
                <span className="font-mono text-white">{localStorageValue || 'null'}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-mono text-white">{typeof localStorageValue}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleSetTestnet}
            className={`px-3 py-2 rounded text-sm font-medium ${
              isTestnet
                ? 'bg-orange-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Set Testnet
          </button>
          
          <button
            onClick={handleSetMainnet}
            className={`px-3 py-2 rounded text-sm font-medium ${
              isMainnet
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            Set Mainnet
          </button>
        </div>

        <div className="bg-gray-700 p-3 rounded text-xs">
          <div className="text-gray-400 mb-2">Debug Info:</div>
          <div className="space-y-1 font-mono text-gray-300">
            <div>Network === 'testnet': {network === 'testnet' ? 'true' : 'false'}</div>
            <div>Network === 'mainnet': {network === 'mainnet' ? 'true' : 'false'}</div>
            <div>Network type: {typeof network}</div>
            <div>Expected for demo: testnet</div>
          </div>
        </div>
      </div>
    </div>
  );
};
