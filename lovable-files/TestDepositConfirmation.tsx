import React, { useState, useEffect } from 'react';
import { apiService } from './api';

interface TestDepositConfirmationProps {
  onDepositConfirmed?: (deposit: any) => void;
}

export const TestDepositConfirmation: React.FC<TestDepositConfirmationProps> = ({ onDepositConfirmed }) => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchPendingDeposits = async () => {
    try {
      setLoading(true);
      const allDeposits = await apiService.getDeposits(50, 0);
      const pendingDeposits = allDeposits.filter((deposit: any) => deposit.status === 'PENDING');
      setDeposits(pendingDeposits);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch deposits:', err);
      setError('Failed to load deposits');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeposit = async (depositId: string) => {
    try {
      setLoading(true);
      const confirmedDeposit = await apiService.confirmDeposit(depositId);
      console.log('Deposit confirmed:', confirmedDeposit);
      
      // Refresh the list
      await fetchPendingDeposits();
      
      onDepositConfirmed?.(confirmedDeposit);
    } catch (err: any) {
      console.error('Failed to confirm deposit:', err);
      setError('Failed to confirm deposit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDeposits();
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Test Deposit Confirmation</h2>
            <button
              onClick={fetchPendingDeposits}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Manually confirm pending deposits for testing purposes
          </p>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {deposits.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💰</div>
              <p className="text-gray-500">No pending deposits found</p>
              <p className="text-sm text-gray-400 mt-1">
                Create a deposit first, then come back here to confirm it
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {deposit.amount} {deposit.currency}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Deposit ID: {deposit.id}
                          </p>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deposit.status)}`}>
                            {deposit.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Wallet Address:</span>
                          <p className="font-mono text-gray-600 break-all">{deposit.walletAddress}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Created:</span>
                          <p className="text-gray-600">{formatTime(deposit.createdAt)}</p>
                        </div>
                        {deposit.meta?.blockchain && (
                          <div>
                            <span className="font-medium text-gray-700">Blockchain:</span>
                            <p className="text-gray-600">{deposit.meta.blockchain}</p>
                          </div>
                        )}
                        {deposit.meta?.network && (
                          <div>
                            <span className="font-medium text-gray-700">Network:</span>
                            <p className="text-gray-600">{deposit.meta.network}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <button
                        onClick={() => confirmDeposit(deposit.id)}
                        disabled={loading || deposit.status !== 'PENDING'}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Confirming...' : 'Confirm Deposit'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <h4 className="font-medium mb-2">How to Test:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Create a deposit using the deposit form</li>
              <li>Copy the generated wallet address</li>
              <li>Send testnet crypto to that address (optional - for real testing)</li>
              <li>Come back here and click "Confirm Deposit" to simulate confirmation</li>
              <li>Check your wallet balance - it should update automatically</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
