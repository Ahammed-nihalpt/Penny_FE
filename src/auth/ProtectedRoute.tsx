import { Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import type { ReactNode } from 'react';
import { useAuth } from '@/auth/useAuth';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
