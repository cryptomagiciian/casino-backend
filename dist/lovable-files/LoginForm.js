"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginForm = void 0;
const react_1 = require("react");
const useAuth_1 = require("../hooks/useAuth");
const LoginForm = () => {
    const [handle, setHandle] = (0, react_1.useState)('');
    const [password, setPassword] = (0, react_1.useState)('');
    const [loading, setLoading] = (0, react_1.useState)(false);
    const { login } = (0, useAuth_1.useAuth)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(handle, password);
        }
        catch (error) {
            alert('Login failed: ' + error.message);
        }
        finally {
            setLoading(false);
        }
    };
    return (<div className="bg-gray-800 rounded-lg p-6 border border-gray-700 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Login</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Handle:
          </label>
          <input type="text" value={handle} onChange={(e) => setHandle(e.target.value)} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" placeholder="Enter your handle"/>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Password:
          </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" placeholder="Enter your password"/>
        </div>
        
        <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 rounded font-bold transition-colors">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p className="text-center text-gray-400 mt-4 text-sm">
        Demo users: demo_user_1, demo_user_2, admin<br />
        Password: password123
      </p>
    </div>);
};
exports.LoginForm = LoginForm;
//# sourceMappingURL=LoginForm.js.map