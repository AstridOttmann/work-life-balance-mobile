import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { api, authApi } from '../services/api';

interface AuthContextValue {
  token: string | null;
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef<() => void>(() => {});
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync('token'),
      SecureStore.getItemAsync('email'),
    ]).then(([t, e]) => {
      setToken(t);
      setEmail(e);
      setLoading(false);
    });
  }, []);

  const logout = useCallback(() => {
    SecureStore.deleteItemAsync('token');
    SecureStore.deleteItemAsync('email');
    setToken(null);
    setEmail(null);
  }, []);

  logoutRef.current = logout;
  tokenRef.current = token;

  const login = useCallback(async (emailInput: string, password: string) => {
    const { token: newToken, email: newEmail } = await authApi.login(emailInput, password);
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('email', newEmail);
    setToken(newToken);
    setEmail(newEmail);
  }, []);

  useEffect(() => {
    const reqId = api.interceptors.request.use(config => {
      if (tokenRef.current) config.headers['Authorization'] = `Bearer ${tokenRef.current}`;
      return config;
    });
    const resId = api.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response?.status === 401 && tokenRef.current) logoutRef.current();
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, email, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
