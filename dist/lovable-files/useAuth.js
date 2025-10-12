"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProvider = exports.useAuth = void 0;
const react_1 = require("react");
const api_1 = require("../services/api");
const AuthContext = (0, react_1.createContext)(null);
const useAuth = () => {
    const context = (0, react_1.useContext)(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
exports.useAuth = useAuth;
const AuthProvider = ({ children }) => {
    const [user, setUser] = (0, react_1.useState)(null);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const initAuth = async () => {
            try {
                const profile = await api_1.apiService.getProfile();
                setUser(profile);
            }
            catch (error) {
                console.log('No valid session');
            }
            finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);
    const login = async (handle, password) => {
        const response = await api_1.apiService.login({ handle, password });
        api_1.apiService.setToken(response.accessToken);
        setUser(response.user);
    };
    const register = async (handle, email, password) => {
        const response = await api_1.apiService.register({ handle, email, password });
        api_1.apiService.setToken(response.accessToken);
        setUser(response.user);
    };
    const logout = () => {
        api_1.apiService.clearToken();
        setUser(null);
    };
    return value = {};
    {
        user, login, register, logout, loading;
    }
};
exports.AuthProvider = AuthProvider;
 >
    { children }
    < /AuthContext.Provider>;
;
;
//# sourceMappingURL=useAuth.js.map