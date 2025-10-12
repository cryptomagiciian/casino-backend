"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const useAuth_1 = require("./hooks/useAuth");
const WalletBalance_1 = require("./components/wallet/WalletBalance");
const GameList_1 = require("./components/games/GameList");
const LoginForm_1 = require("./components/auth/LoginForm");
const RegisterForm_1 = require("./components/auth/RegisterForm");
const AppContent = () => {
    const { user, logout, loading } = (0, useAuth_1.useAuth)();
    const [showRegister, setShowRegister] = (0, react_1.useState)(false);
    if (loading) {
        return (<div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>);
    }
    if (!user) {
        return (<div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {showRegister ? <RegisterForm_1.RegisterForm /> : <LoginForm_1.LoginForm />}
          <div className="text-center mt-4">
            <button onClick={() => setShowRegister(!showRegister)} className="text-yellow-400 hover:text-yellow-300 underline">
              {showRegister ? 'Already have an account? Login' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-900 text-white">
      
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-yellow-400">🎰 Casino</h1>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, <span className="font-bold text-white">{user.handle}</span></span>
            <button onClick={logout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded font-bold transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <WalletBalance_1.WalletBalance />
          </div>
          
          
          <div className="lg:col-span-2">
            <GameList_1.GameList />
          </div>
        </div>
      </main>
    </div>);
};
function App() {
    return (<useAuth_1.AuthProvider>
      <AppContent />
    </useAuth_1.AuthProvider>);
}
exports.default = App;
//# sourceMappingURL=App.js.map