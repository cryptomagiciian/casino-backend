import React, { useState, useEffect } from 'react';
import { useNetwork } from './NetworkContext';

export const NetworkIntegrationTest: React.FC = () => {
  const [contextError, setContextError] = useState<string | null>(null);
  const [networkData, setNetworkData] = useState<any>(null);

  useEffect(() => {
    try {
      const { network, setNetwork, isMainnet, isTestnet } = useNetwork();
      setNetworkData({ network, isMainnet, isTestnet });
      setContextError(null);
    } catch (error: any) {
      setContextError(error.message);
    }
  }, []);

  if (contextError) {
    return (
      <div className="bg-red-800 border border-red-600 rounded-lg p-4 mb-4">
        <h3 className="text-red-400 font-semibold mb-4">❌ Network Context Error</h3>
        <div className="text-red-300 text-sm">
          <p><strong>Error:</strong> {contextError}</p>
          <p className="mt-2"><strong>Solution:</strong> Make sure your app is wrapped with NetworkProvider:</p>
          <pre className="mt-2 p-2 bg-red-900 rounded text-xs">
{`<NetworkProvider>
  <YourApp />
</NetworkProvider>`}
          </pre>
        </div>
      </div>
    );
  }

  if (!networkData) {
    return (
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
        <h3 className="text-white font-semibold mb-4">🧪 Network Integration Test</h3>
        <div className="text-gray-300">Loading network context...</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 mb-4">
      <h3 className="text-white font-semibold mb-4">🧪 Network Integration Test</h3>
      
      <div className="space-y-3">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm mb-2">Network Context Status:</div>
          <div className="text-green-400 text-sm">✅ NetworkContext is working correctly</div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm mb-2">Current Values:</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Network:</span>
              <span className="font-mono text-white">{JSON.stringify(networkData.network)}</span>
            </div>
            <div className="flex justify-between">
              <span>Is Mainnet:</span>
              <span className={`font-mono ${networkData.isMainnet ? 'text-green-400' : 'text-red-400'}`}>
                {networkData.isMainnet ? 'true' : 'false'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Is Testnet:</span>
              <span className={`font-mono ${networkData.isTestnet ? 'text-green-400' : 'text-red-400'}`}>
                {networkData.isTestnet ? 'true' : 'false'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-gray-400 text-sm mb-2">Expected for Demo Mode:</div>
          <div className="text-sm">
            <div>Network should be: <span className="text-yellow-400 font-mono">"testnet"</span></div>
            <div>Is Testnet should be: <span className="text-yellow-400 font-mono">true</span></div>
            <div>Is Mainnet should be: <span className="text-yellow-400 font-mono">false</span></div>
          </div>
        </div>
        
        {networkData.network !== 'testnet' && (
          <div className="bg-orange-800 border border-orange-600 rounded p-3">
            <div className="text-orange-400 text-sm">
              ⚠️ <strong>Issue Found:</strong> Network is not set to 'testnet' for demo mode.
              <br />
              This explains why the balance API calls are going to mainnet instead of testnet.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
