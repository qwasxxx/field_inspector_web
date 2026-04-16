import { useEffect, useState } from 'react';
import type { ProfileRow } from '@/entities/factory/model/types';
import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '@/shared/lib/supabase/client';

type State = {
  loading: boolean;
  profile: ProfileRow | null;
  error: string | null;
};

const idle: State = { loading: false, profile: null, error: null };

export function useAdminProfile(): State & { isAdmin: boolean } {
  const [state, setState] = useState<State>({
    loading: isSupabaseConfigured(),
    profile: null,
    error: null,
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState(idle);
      return;
    }

    const client = getSupabaseClient();
    let cancelled = false;

    async function loadProfile() {
      setState((s) => ({ ...s, loading: true, error: null }));
      const {
        data: { user },
      } = await client.auth.getUser();
      if (!user) {
        if (!cancelled) setState({ loading: false, profile: null, error: null });
        return;
      }
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        setState({ loading: false, profile: null, error: error.message });
        return;
      }
      setState({
        loading: false,
        profile: (data as ProfileRow) ?? null,
        error: null,
      });
    }

    void loadProfile();

    const { data: sub } = client.auth.onAuthStateChange(() => {
      void loadProfile();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isAdmin = Boolean(
    state.profile?.role === 'admin' && state.profile.is_active,
  );

  return { ...state, isAdmin };
}
