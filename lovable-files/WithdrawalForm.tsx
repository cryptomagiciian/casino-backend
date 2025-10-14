import React, { useState } from 'react';
import { apiService } from './api';
import { notificationService } from './NotificationService';

interface WithdrawalFormProps {
  onWithdrawalCreated?: (withdrawal: any) => void;
}

export const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ onWithdrawalCreated }) => {
  const [currency, setCurrency] = useState<string>('BTC');
  const [amount, setAmount] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('testnet');
  const [blockchain, setBlockchain] = useState<string>('BTC'); // For multi-chain tokens
  const [loading, setLoading] = useState(false);
  const [withdrawal, setWithdrawal] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const currencies = [
    { value: 'BTC', label: 'Bitcoin (BTC)', minAmount: 0.0001, fee: 0.0001, blockchains: ['BTC'] },
    { value: 'ETH', label: 'Ethereum (ETH)', minAmount: 0.001, fee: 0.005, blockchains: ['ETH'] },
    { value: 'SOL', label: 'Solana (SOL)', minAmount: 0.01, fee: 0.001, blockchains: ['SOL'] },
    { value: 'USDC', label: 'USD Coin (USDC)', minAmount: 1, fee: 5, blockchains: ['ETH', 'SOL', 'BTC'] },
    { value: 'USDT', label: 'Tether (USDT)', minAmount: 1, fee: 5, blockchains: ['ETH', 'SOL', 'BTC'] },
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
      const withdrawalData = {
        currency,
        amount: parseFloat(amount),
        walletAddress: address,
        network,
        blockchain, // Include blockchain selection
      };

      console.log('Creating withdrawal:', withdrawalData);
      const result = await apiService.createWithdrawal(withdrawalData);
      console.log('Withdrawal created:', result);
      
      setWithdrawal(result);
      onWithdrawalCreated?.(result);

      // Add notification for withdrawal creation
      notificationService.addManualNotification(
        'withdrawal',
        'Withdrawal Submitted! 🚀',
        `Your withdrawal of ${amount} ${currency} has been submitted and is being processed.`,
        {
          amount: parseFloat(amount),
          currency,
          status: 'PENDING'
        }
      );
    } catch (err: any) {
      console.error('Withdrawal creation failed:', err);
      setError(err.message || 'Failed to create withdrawal');
    } finally {
      setLoading(false);
    }
  };

  if (withdrawal) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Withdrawal Submitted</h3>
          <p className="text-sm text-gray-600 mt-2">
            Your withdrawal is being processed
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono">
              {withdrawal.id}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              {withdrawal.amount} {withdrawal.currency}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination Address
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono">
              {withdrawal.walletAddress}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {withdrawal.status}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Processing Time
            </label>
            <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm">
              {withdrawal.processingTime}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Withdrawal Information
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Withdrawal fee: {withdrawal.fee} {currency}</li>
                    <li>Net amount: {withdrawal.netAmount} {currency}</li>
                    <li>Network: {network}</li>
                    <li>You will receive a confirmation email</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              setWithdrawal(null);
              setAmount('');
              setAddress('');
            }}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Create New Withdrawal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Create Withdrawal</h2>
      
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
          <p className="text-xs text-gray-500 mt-1">
            Fee: {selectedCurrency?.fee} {currency}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Destination Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={`Enter your ${currency} address`}
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
          disabled={loading || !amount || !address}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Withdrawal...' : 'Create Withdrawal'}
        </button>
      </form>
    </div>
  );
};
