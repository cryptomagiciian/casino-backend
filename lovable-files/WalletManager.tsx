import React, { useState } from 'react';
import { DepositForm } from './DepositForm';
import { WithdrawalForm } from './WithdrawalForm';
import { WalletBalance } from './WalletBalance';

export const WalletManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'balance' | 'deposit' | 'withdraw'>('balance');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('balance')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'balance'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Wallet Balance
              </div>
            </button>
            <button
              onClick={() => setActiveTab('deposit')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'deposit'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Deposit
              </div>
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'withdraw'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4m16 0l-4-4m4 4l-4 4" />
                </svg>
                Withdraw
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'balance' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Wallet Balances</h2>
              <WalletBalance />
            </div>
          )}

          {activeTab === 'deposit' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Deposit Funds</h2>
              <DepositForm />
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Withdraw Funds</h2>
              <WithdrawalForm />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
