import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, fullName: string) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function storeTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('agrosense_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('agrosense_refresh_token', refreshToken);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('agrosense_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authAPI.getProfile(token)
        .then(res => setUser(res.data))
        .catch(async () => {
          // Access token expired - try the refresh token before logging out
          const refreshToken = localStorage.getItem('agrosense_refresh_token');
          if (refreshToken) {
            try {
              const res = await authAPI.refresh(refreshToken);
              storeTokens(res.data.access_token, res.data.refresh_token);
              setToken(res.data.access_token);
              setUser(res.data.user);
              return;
            } catch {
              // fall through to logout
            }
          }
          localStorage.removeItem('agrosense_token');
          localStorage.removeItem('agrosense_refresh_token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    storeTokens(res.data.access_token, res.data.refresh_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  const register = async (email: string, username: string, password: string, fullName: string) => {
    const res = await authAPI.register(email, username, password, fullName);
    storeTokens(res.data.access_token, res.data.refresh_token);
    setToken(res.data.access_token);
    setUser(res.data.user);
  };

  // Used by the Google OAuth callback page (tokens arrive via URL params)
  const loginWithTokens = async (accessToken: string, refreshToken?: string) => {
    storeTokens(accessToken, refreshToken);
    setToken(accessToken);
    const res = await authAPI.getProfile(accessToken);
    setUser(res.data);
  };

  const logout = () => {
    localStorage.removeItem('agrosense_token');
    localStorage.removeItem('agrosense_refresh_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginWithTokens, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
