import React, { createContext, useContext, useState, useEffect } from 'react';

export type Network = 'mainnet' | 'testnet';

interface NetworkContextType {
  network: Network;
  setNetwork: (network: Network) => void;
  isMainnet: boolean;
  isTestnet: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [network, setNetwork] = useState<Network>('mainnet');

  // Load network preference from localStorage
  useEffect(() => {
    const savedNetwork = localStorage.getItem('casino-network') as Network;
    if (savedNetwork && (savedNetwork === 'mainnet' || savedNetwork === 'testnet')) {
      setNetwork(savedNetwork);
    }
  }, []);

  // Save network preference to localStorage
  const handleSetNetwork = (newNetwork: Network) => {
    setNetwork(newNetwork);
    localStorage.setItem('casino-network', newNetwork);
  };

  const value = {
    network,
    setNetwork: handleSetNetwork,
    isMainnet: network === 'mainnet',
    isTestnet: network === 'testnet',
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
