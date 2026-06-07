import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/auth/authStore';

export function HomePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>Welcome to Penny, {user?.name} 👋</Title>
        <Text c="dimmed">{user?.email}</Text>
        <Text>Your dashboard and copilot will live here.</Text>
        <Group>
          <Button component={Link} to="/invoices">
            View invoices
          </Button>
          <Button onClick={() => void logout()} variant="light">
            Log out
          </Button>
        </Group>
      </Stack>
    </Container>
  );
}
