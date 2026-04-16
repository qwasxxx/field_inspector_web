import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/features/auth/model/useAuth';

type Props = {
  children: ReactNode;
};

/** Если уже авторизован — не показываем экран входа/регистрации. */
export function PublicRoute({ children }: Props) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
