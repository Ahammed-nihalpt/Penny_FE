import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { AppLayout } from '@/components/AppLayout';
import { ProtectedRoute } from '@/auth/ProtectedRoute';
import { useAuthStore } from '@/auth/authStore';

// Route-level code-splitting: each page becomes its own chunk, so the login
// screen no longer ships the charts (Dashboard) or copilot bundles. Pages are
// named exports, so we map the named export onto `default` for React.lazy.
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() =>
  import('@/pages/SignupPage').then((m) => ({ default: m.SignupPage })),
);
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const InvoicesPage = lazy(() =>
  import('@/features/invoices/InvoicesPage').then((m) => ({ default: m.InvoicesPage })),
);
const CopilotPage = lazy(() =>
  import('@/features/chat/CopilotPage').then((m) => ({ default: m.CopilotPage })),
);

const PageFallback = (
  <Center h="60vh">
    <Loader />
  </Center>
);

export function App() {
  const init = useAuthStore((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <Suspense fallback={PageFallback}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/chat" element={<CopilotPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
