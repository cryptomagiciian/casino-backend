import { useState, useEffect, createContext, useContext } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  handle: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  login: (handle: string, password: string) => Promise<void>;
  register: (handle: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const profile = await apiService.getProfile();
        setUser(profile);
      } catch (error) {
        console.log('No valid session');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (handle: string, password: string) => {
    const response = await apiService.login({ handle, password });
    apiService.setToken(response.accessToken);
    setUser(response.user);
  };

  const register = async (handle: string, email: string, password: string) => {
    const response = await apiService.register({ handle, email, password });
    apiService.setToken(response.accessToken);
    setUser(response.user);
  };

  const logout = () => {
    apiService.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
