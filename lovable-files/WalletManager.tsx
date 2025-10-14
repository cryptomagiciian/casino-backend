import React, { useState, useEffect } from 'react';
import { WalletBalanceDropdown } from './WalletBalanceDropdown';
import { TestnetFaucet } from './TestnetFaucet';
import { useNetwork } from './NetworkContext';

interface WalletManagerProps {
  className?: string;
}

export const WalletManager: React.FC<WalletManagerProps> = ({ className = '' }) => {
  const { network } = useNetwork();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleBalanceUpdate = () => {
    // Force refresh of wallet balance by updating the key
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className={className}>
      {/* Testnet Faucet - only show on testnet */}
      {network === 'testnet' && (
        <TestnetFaucet 
          onBalanceUpdate={handleBalanceUpdate}
          className="mb-6"
        />
      )}

      {/* Wallet Balance Dropdown */}
      <WalletBalanceDropdown 
        key={refreshKey} // Force re-render when refreshKey changes
        onBalanceUpdate={handleBalanceUpdate}
        position="top-right"
      />
    </div>
  );
};