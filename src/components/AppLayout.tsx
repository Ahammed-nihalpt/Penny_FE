import { AppShell, Button, Group, Text } from '@mantine/core';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/auth/authStore';

export function AppLayout() {
  const logout = useAuthStore((s) => s.logout);
  const { pathname } = useLocation();

  const navLink = (to: string, label: string) => (
    <Button component={Link} to={to} size="sm" variant={pathname === to ? 'light' : 'subtle'}>
      {label}
    </Button>
  );

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <Text fw={700} size="lg" c="teal">
              Penny
            </Text>
            {navLink('/', 'Dashboard')}
            {navLink('/invoices', 'Invoices')}
          </Group>
          <Button variant="default" size="sm" onClick={() => void logout()}>
            Log out
          </Button>
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
