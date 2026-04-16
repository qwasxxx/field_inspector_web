import { Box, CircularProgress } from '@mui/material';
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/model/useAuth';
import { isSupabaseConfigured } from '@/shared/lib/supabase/client';

type Props = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: Props) {
  const { authReady, isAuthenticated } = useAuth();
  if (isSupabaseConfigured() && !authReady) {
    return (
      <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
