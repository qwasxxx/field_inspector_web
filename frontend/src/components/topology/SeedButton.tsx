import { Alert, Button, CircularProgress } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/shared/lib/supabase/client';
import { seedTopologyDemo } from '@/data/topology-seed';
import { countEquipmentNodes } from '@/hooks/useTopologyNodes';

export type SeedButtonProps = {
  onSeeded: () => void;
};

export function SeedButton({ onSeeded }: SeedButtonProps) {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      if (!isSupabaseConfigured()) {
        setVisible(false);
        return;
      }
      const n = await countEquipmentNodes();
      setVisible(n === 0);
    })();
  }, []);

  const run = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const supabase = getSupabaseClient();
      await seedTopologyDemo(supabase);
      onSeeded();
      setVisible(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [onSeeded]);

  if (!visible) return null;

  return (
    <>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      <Button
        variant="outlined"
        color="primary"
        disabled={loading}
        onClick={() => void run()}
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : null}
        Загрузить демо-данные
      </Button>
    </>
  );
}
