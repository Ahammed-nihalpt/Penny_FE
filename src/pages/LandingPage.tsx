import { Link, Navigate } from 'react-router-dom';
import {
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useAuthStore } from '@/auth/authStore';
import { PennyMark } from '@/components/PennyMark';

function HeroMock() {
  return (
    <Box style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
      <Card withBorder radius="lg" padding="lg" shadow="md">
        <Group justify="space-between" mb="xs">
          <Text size="xs" tt="uppercase" fw={600} c="dimmed" style={{ letterSpacing: '0.5px' }}>
            Outstanding
          </Text>
          <Badge color="copper" variant="light">
            2 overdue
          </Badge>
        </Group>
        <Text fw={700} fz="2rem" c="teal.7" style={{ fontVariantNumeric: 'tabular-nums' }}>
          $1,840.00
        </Text>
        <Stack gap="xs" mt="md">
          {[
            { v: 'Acme Supplies', a: '650.00', s: 'overdue', c: 'red' },
            { v: 'Bolt Hosting', a: '40.00', s: 'open', c: 'copper' },
            { v: 'City Water', a: '120.00', s: 'paid', c: 'teal' },
          ].map((r) => (
            <Group key={r.v} justify="space-between" wrap="nowrap">
              <Text size="sm" fw={500}>
                {r.v}
              </Text>
              <Group gap="sm" wrap="nowrap">
                <Text size="sm" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {r.a}
                </Text>
                <Badge size="xs" variant="light" color={r.c}>
                  {r.s}
                </Badge>
              </Group>
            </Group>
          ))}
        </Stack>
      </Card>

      <Paper
        withBorder
        radius="lg"
        p="sm"
        shadow="md"
        style={{
          position: 'absolute',
          bottom: -28,
          right: -16,
          maxWidth: 260,
          background: 'var(--mantine-color-copper-0)',
          borderColor: 'var(--mantine-color-copper-1)',
        }}
      >
        <Group gap={8} align="flex-start" wrap="nowrap">
          <PennyMark size={24} />
          <Text size="sm">You owe $1,840 across 5 invoices, $980 of it overdue.</Text>
        </Group>
      </Paper>
    </Box>
  );
}

export function LandingPage() {
  const user = useAuthStore((s) => s.user);
  // Logged-in visitors skip the marketing page and go straight to the app.
  if (user) return <Navigate to="/dashboard" replace />;

  return (
    <Box mih="100vh" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <Container size="lg" py="md" w="100%">
        <Group justify="space-between">
          <Group gap={8}>
            <PennyMark size={28} />
            <Text fw={700} fz="lg" c="copper.7" style={{ letterSpacing: '-0.4px' }}>
              AskPenny
            </Text>
          </Group>
          <Group gap="xs">
            <Button component={Link} to="/login" variant="subtle" color="gray">
              Log in
            </Button>
            <Button component={Link} to="/signup">
              Get started
            </Button>
          </Group>
        </Group>
      </Container>

      {/* Hero */}
      <Container
        size="lg"
        py="xl"
        w="100%"
        style={{ flex: 1, display: 'flex', alignItems: 'center' }}
      >
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={56} verticalSpacing={56} w="100%">
          <Stack gap="lg" justify="center">
            <Badge variant="light" color="copper" radius="sm" w="fit-content">
              AI invoice copilot
            </Badge>
            <Title fz={{ base: 34, md: 46 }} fw={700} lh={1.1}>
              Stop chasing invoices. Just ask Penny.
            </Title>
            <Text c="dimmed" fz="lg" maw={460}>
              Snap a photo of a bill and Penny reads it, tracks what you owe, and takes action when
              you ask. Built for busy small-business owners, not accountants.
            </Text>
            <Group gap="sm" mt="xs">
              <Button component={Link} to="/signup" size="md">
                Get started free
              </Button>
              <Button component={Link} to="/login" size="md" variant="default">
                Log in
              </Button>
            </Group>
            <Text size="xs" c="dimmed">
              No credit card. Sign up with email or Google.
            </Text>
          </Stack>

          <Group justify="center" align="center">
            <HeroMock />
          </Group>
        </SimpleGrid>
      </Container>
    </Box>
  );
}
