import type { ReactNode } from 'react';
import { Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { PennyMark } from '@/components/PennyMark';

interface AuthShellProps {
  title: string;
  tagline: string;
  children: ReactNode;
}

// Branded frame for the login / signup screens: soft backdrop (.auth-backdrop),
// the Penny mark + wordmark, a short human tagline, then the form card.
export function AuthShell({ title, tagline, children }: AuthShellProps) {
  return (
    <Box className="auth-backdrop">
      <Stack w="100%" maw={420} gap="lg">
        <Stack gap={6} align="center">
          <Group gap={8}>
            <PennyMark size={34} />
            <Text fw={700} fz={28} c="copper.7" style={{ letterSpacing: '-0.5px' }}>
              Penny
            </Text>
          </Group>
          <Title order={2} ta="center" fw={600}>
            {title}
          </Title>
          <Text c="dimmed" ta="center" size="sm">
            {tagline}
          </Text>
        </Stack>
        <Paper withBorder shadow="md" p="xl" radius="lg">
          {children}
        </Paper>
      </Stack>
    </Box>
  );
}
