import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import type { LoginFormValues } from '@/features/auth/model/validation';
import {
  API_BASE,
  apiLoginJson,
  getStoredToken,
  setStoredToken,
} from '@/shared/api/client';
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '@/shared/lib/supabase/client';

const LEGACY_AUTH_KEY = 'fi_auth';

export type AuthContextValue = {
  /** False until Supabase session is hydrated (only when Supabase env is set). */
  authReady: boolean;
  login: (credentials: LoginFormValues) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: () => boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

function readLegacyFlag(): boolean {
  return localStorage.getItem(LEGACY_AUTH_KEY) === '1';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured());
  const [authVersion, setAuthVersion] = useState(0);
  const [supabaseAuthed, setSupabaseAuthed] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const client = getSupabaseClient();

    void client.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        setSupabaseAuthed(Boolean(data.session));
        setAuthReady(true);
      })
      .catch((err: unknown) => {
        console.error('[AuthProvider] Supabase getSession failed', err);
        setSupabaseAuthed(false);
        setAuthReady(true);
      });

    const { data: sub } = client.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setSupabaseAuthed(Boolean(session));
        setAuthVersion((v) => v + 1);
      },
    );

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginFormValues) => {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      const { error } = await client.auth.signInWithPassword({
        email: credentials.email.trim(),
        password: credentials.password,
      });
      if (error) throw error;
      localStorage.setItem(LEGACY_AUTH_KEY, '1');
      setAuthVersion((v) => v + 1);
      return;
    }

    if (API_BASE) {
      const data = await apiLoginJson({
        email: credentials.email,
        password: credentials.password,
      });
      setStoredToken(data.access_token);
      localStorage.setItem(LEGACY_AUTH_KEY, '1');
      setAuthVersion((v) => v + 1);
      return;
    }

    localStorage.setItem(LEGACY_AUTH_KEY, '1');
    setAuthVersion((v) => v + 1);
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      await client.auth.signOut();
    }
    setStoredToken(null);
    localStorage.removeItem(LEGACY_AUTH_KEY);
    setSupabaseAuthed(false);
    setAuthVersion((v) => v + 1);
  }, []);

  const isAuthenticated = useCallback(() => {
    void authVersion;
    if (isSupabaseConfigured()) return supabaseAuthed;
    if (API_BASE) return Boolean(getStoredToken());
    return readLegacyFlag();
  }, [authVersion, supabaseAuthed]);

  const value = useMemo(
    () => ({ authReady, login, logout, isAuthenticated }),
    [authReady, login, logout, isAuthenticated],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
