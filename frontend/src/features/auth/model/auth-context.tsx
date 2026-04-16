import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LoginFormValues } from '@/features/auth/model/validation';
import {
  API_BASE,
  apiLoginJson,
  getStoredToken,
  setStoredToken,
} from '@/shared/api/client';

const LEGACY_AUTH_KEY = 'fi_auth';

export type AuthContextValue = {
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => void;
  isAuthenticated: () => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function readInitialAuthenticated(): boolean {
  if (API_BASE) return Boolean(getStoredToken());
  return localStorage.getItem(LEGACY_AUTH_KEY) === '1';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(readInitialAuthenticated);

  const login = useCallback(async (credentials: LoginFormValues) => {
    if (API_BASE) {
      const data = await apiLoginJson({
        email: credentials.email,
        password: credentials.password,
      });
      setStoredToken(data.access_token);
      localStorage.setItem(LEGACY_AUTH_KEY, '1');
    } else {
      localStorage.setItem(LEGACY_AUTH_KEY, '1');
    }
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    localStorage.removeItem(LEGACY_AUTH_KEY);
    setAuthenticated(false);
  }, []);

  const isAuthenticated = useCallback(() => {
    if (!authenticated) return false;
    if (API_BASE) return Boolean(getStoredToken());
    return localStorage.getItem(LEGACY_AUTH_KEY) === '1';
  }, [authenticated]);

  const value = useMemo(
    () => ({ login, logout, isAuthenticated }),
    [login, logout, isAuthenticated],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
