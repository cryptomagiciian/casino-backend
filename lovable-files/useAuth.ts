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
        // Check if we have a token first
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.log('No token found in localStorage');
          setLoading(false);
          return;
        }

        // Try to get profile with the existing token
        const profile = await apiService.getProfile();
        setUser(profile);
        console.log('✅ Valid session restored');
      } catch (error) {
        console.log('❌ No valid session - token may be expired');
        // Clear any invalid token
        apiService.clearToken();
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
