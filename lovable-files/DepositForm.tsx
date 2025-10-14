import React, { useState } from 'react';
import { apiService } from './api';
import { notificationService } from './NotificationService';

interface DepositFormProps {
  onDepositCreated?: (deposit: any) => void;
}

export const DepositForm: React.FC<DepositFormProps> = ({ onDepositCreated }) => {
  const [currency, setCurrency] = useState<string>('BTC');
  const [amount, setAmount] = useState<string>('');
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');
  const [blockchain, setBlockchain] = useState<string>('BTC'); // For multi-chain tokens
  const [loading, setLoading] = useState(false);
  const [deposit, setDeposit] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const currencies = [
    { value: 'BTC', label: 'Bitcoin (BTC)', minAmount: 0.0001, blockchains: ['BTC'] },
    { value: 'ETH', label: 'Ethereum (ETH)', minAmount: 0.001, blockchains: ['ETH'] },
    { value: 'SOL', label: 'Solana (SOL)', minAmount: 0.01, blockchains: ['SOL'] },
    { value: 'USDC', label: 'USD Coin (USDC)', minAmount: 1, blockchains: ['ETH', 'SOL', 'BTC'] },
    { value: 'USDT', label: 'Tether (USDT)', minAmount: 1, blockchains: ['ETH', 'SOL', 'BTC'] },
  ];

  const blockchainOptions = {
    BTC: { label: 'Bitcoin Network', icon: '₿' },
    ETH: { label: 'Ethereum Network', icon: 'Ξ' },
    SOL: { label: 'Solana Network', icon: '◎' },
  };

  const selectedCurrency = currencies.find(c => c.value === currency);
  const availableBlockchains = selectedCurrency?.blockchains || ['BTC'];

  // Update blockchain when currency changes
  React.useEffect(() => {
    if (!availableBlockchains.includes(blockchain)) {
      setBlockchain(availableBlockchains[0]);
    }
  }, [currency, availableBlockchains, blockchain]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const depositData = {
        currency,
        amount: parseFloat(amount),
        network,
        blockchain, // Include blockchain selection
      };

      console.log('Creating deposit:', depositData);
      const result = await apiService.createDeposit(depositData);
      console.log('Deposit created:', result);
      
      setDeposit(result);
      onDepositCreated?.(result);

      // Add notification for deposit creation
      notificationService.addManualNotification(
        'deposit',
        'Deposit Address Generated! 📍',
        `Your ${currency} deposit address has been generated. Send ${amount} ${currency} to complete your deposit.`,
        {
          amount: parseFloat(amount),
          currency,
          status: 'PENDING'
        }
      );
    } catch (err: any) {
      console.error('Deposit creation failed:', err);
      setError(err.message || 'Failed to create deposit');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (deposit) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Deposit Address Generated</h3>
          <p className="text-sm text-gray-600 mt-2">
            Send {amount} {currency} to the address below
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Network: {blockchainOptions[blockchain as keyof typeof blockchainOptions]?.label} ({network})
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Address
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={deposit.walletAddress}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
              />
              <button
                onClick={() => copyToClipboard(deposit.walletAddress)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              QR Code
            </label>
            <div className="bg-gray-100 p-4 rounded-md text-center">
              <div className="text-sm text-gray-600">
                QR Code: {deposit.qrCodeData}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explorer Link
            </label>
            <a
              href={deposit.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm underline"
            >
              View on Blockchain Explorer
            </a>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Instructions
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Only send {currency} to this address</li>
                    <li>Minimum amount: {selectedCurrency?.minAmount} {currency}</li>
                    <li>Blockchain: {blockchainOptions[blockchain as keyof typeof blockchainOptions]?.label}</li>
                    <li>Network: {network}</li>
                    <li>Deposit will be credited after confirmations</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setDeposit(null);
              setAmount('');
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Create New Deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Deposit</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {currencies.map((curr) => (
              <option key={curr.value} value={curr.value}>
                {curr.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={selectedCurrency?.minAmount}
            step="0.0001"
            placeholder={`Minimum: ${selectedCurrency?.minAmount}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {availableBlockchains.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blockchain Network
            </label>
            <select
              value={blockchain}
              onChange={(e) => setBlockchain(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableBlockchains.map((chain) => (
                <option key={chain} value={chain}>
                  {blockchainOptions[chain as keyof typeof blockchainOptions]?.icon} {blockchainOptions[chain as keyof typeof blockchainOptions]?.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the blockchain network for {currency}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Network Type
          </label>
          <select
            value={network}
            onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'testnet')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="testnet">Testnet (Recommended for testing)</option>
            <option value="mainnet">Mainnet (Real funds)</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !amount}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Deposit...' : 'Create Deposit'}
        </button>
      </form>
    </div>
  );
};
