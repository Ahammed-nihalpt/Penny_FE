import { Suspense } from 'react';
import { AppShell, Burger, Button, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/auth/authStore';
import { PennyMark } from '@/components/PennyMark';

export function AppLayout() {
  const logout = useAuthStore((s) => s.logout);
  const { pathname } = useLocation();
  // Burger only matters on mobile; the navbar is permanent on desktop.
  const [opened, { toggle, close }] = useDisclosure();

  const navLink = (to: string, label: string) => {
    const active = pathname === to;
    return (
      <Button
        component={Link}
        to={to}
        onClick={close}
        justify="flex-start"
        fullWidth
        size="md"
        variant={active ? 'light' : 'subtle'}
        color={active ? 'teal' : 'gray'}
      >
        {label}
      </Button>
    );
  };

  const brand = (
    <Group gap={8}>
      <PennyMark size={26} />
      <Text fw={700} size="lg" c="copper.7" style={{ letterSpacing: '-0.4px' }}>
        AskPenny
      </Text>
    </Group>
  );

  return (
    <AppShell
      header={{ height: { base: 56, sm: 0 } }}
      navbar={{ width: 240, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header hiddenFrom="sm">
        <Group h="100%" px="md" gap="sm">
          <Burger opened={opened} onClick={toggle} size="sm" aria-label="Toggle navigation" />
          {brand}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack h="100%" justify="space-between">
          <Stack gap="xs">
            <Group visibleFrom="sm" mb="md" px="xs">
              {brand}
            </Group>
            {navLink('/dashboard', 'Dashboard')}
            {navLink('/invoices', 'Invoices')}
            {navLink('/chat', 'Copilot')}
          </Stack>
          <Button variant="default" onClick={() => void logout()}>
            Log out
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Suspense
          fallback={
            <Center h="60vh">
              <Loader />
            </Center>
          }
        >
          <Outlet />
        </Suspense>
      </AppShell.Main>
    </AppShell>
  );
}
