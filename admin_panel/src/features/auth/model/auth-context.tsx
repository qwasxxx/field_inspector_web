import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'fi_auth';

export type AuthContextValue = {
  login: () => void;
  logout: () => void;
  isAuthenticated: () => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function readStored(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(readStored);

  const login = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuthenticated(false);
  }, []);

  const isAuthenticated = useCallback(() => authenticated, [authenticated]);

  const value = useMemo(
    () => ({ login, logout, isAuthenticated }),
    [login, logout, isAuthenticated],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
