import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { useAuth } from '@/auth/useAuth';

export function HomePage() {
  const { user, logout } = useAuth();
  return (
    <Container size="sm" py="xl">
      <Stack>
        <Title order={2}>Welcome to Penny, {user?.name} 👋</Title>
        <Text c="dimmed">{user?.email}</Text>
        <Text>Your dashboard, invoices, and copilot will live here.</Text>
        <Button onClick={() => void logout()} variant="light" w="fit-content">
          Log out
        </Button>
      </Stack>
    </Container>
  );
}
