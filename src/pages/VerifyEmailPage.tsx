import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Anchor, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { useAuthStore } from '@/auth/authStore';
import { AuthShell } from '@/pages/AuthShell';

type State = 'loading' | 'ok' | 'error';

export function VerifyEmailPage() {
  const verifyEmail = useAuthStore((s) => s.verifyEmail);
  const [params] = useSearchParams();
  const token = params.get('token');
  // No token → 'error' from the start (no setState in the effect needed).
  const [state, setState] = useState<State>(token ? 'loading' : 'error');
  const ran = useRef(false); // guard against double-run in StrictMode

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    verifyEmail(token)
      .then(() => setState('ok'))
      .catch(() => setState('error'));
  }, [token, verifyEmail]);

  if (state === 'loading') {
    return (
      <AuthShell title="Verifying your email" tagline="One moment…">
        <Center py="md">
          <Loader />
        </Center>
      </AuthShell>
    );
  }

  if (state === 'ok') {
    return (
      <AuthShell title="Email verified" tagline="You're all set.">
        <Stack>
          <Text size="sm">Your email is confirmed. You can now log in to AskPenny.</Text>
          <Button component={Link} to="/login" fullWidth>
            Go to log in
          </Button>
        </Stack>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Link expired or invalid" tagline="That verification link didn't work.">
      <Stack>
        <Text size="sm">
          The link may have expired (they last 24 hours) or already been used. Log in and we'll let
          you resend a fresh one.
        </Text>
        <Anchor component={Link} to="/login" ta="center">
          Back to log in
        </Anchor>
      </Stack>
    </AuthShell>
  );
}
