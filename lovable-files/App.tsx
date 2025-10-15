import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { NetworkProvider } from './NetworkContext';
import { NetworkToggle } from './NetworkToggle';
import { BalanceProvider } from './BalanceContext';
import { PriceProvider } from './PriceManager';
import { WalletBalance } from './components/wallet/WalletBalance';
import { GameList } from './components/games/GameList';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';

const AppContent: React.FC = () => {
  const { user, logout, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showRegister ? <RegisterForm /> : <LoginForm />}
          <div className="text-center mt-4">
            <button
              onClick={() => setShowRegister(!showRegister)}
              className="text-yellow-400 hover:text-yellow-300 underline"
            >
              {showRegister ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">🎰 Casino</h1>
          
          <div className="flex items-center space-x-4">
            <NetworkToggle />
            <span className="text-gray-300">Welcome, <span className="font-bold text-white">{user.handle}</span></span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wallet */}
          <div className="lg:col-span-1">
            <WalletBalance />
          </div>
          
          {/* Games */}
          <div className="lg:col-span-2">
            <GameList />
          </div>
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <PriceProvider>
      <AuthProvider>
        <NetworkProvider>
          <BalanceProvider>
            <AppContent />
          </BalanceProvider>
        </NetworkProvider>
      </AuthProvider>
    </PriceProvider>
  );
}

export default App;
