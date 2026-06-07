import { Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/auth/authStore';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
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
