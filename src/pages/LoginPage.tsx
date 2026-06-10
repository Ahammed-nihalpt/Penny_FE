import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Alert, Anchor, Button, Divider, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { GoogleLogin } from '@react-oauth/google';
import { AxiosError } from 'axios';
import { useAuthStore } from '@/auth/authStore';
import { AuthShell } from '@/pages/AuthShell';

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const resendVerification = useAuthStore((s) => s.resendVerification);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (v) => {
        const value = v.trim();
        if (!value) return 'Email is required';
        const ok = value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        return ok ? null : 'Enter a valid email address';
      },
      password: (v) => (v.length >= 8 ? null : 'Min 8 characters'),
    },
  });

  const submit = form.onSubmit(async (values) => {
    setBusy(true);
    setUnverified(false);
    try {
      await login({ email: values.email.trim().toLowerCase(), password: values.password });
      void navigate('/dashboard');
    } catch (err) {
      const data =
        err instanceof AxiosError ? (err.response?.data as { code?: string }) : undefined;
      if (data?.code === 'EMAIL_NOT_VERIFIED') {
        setUnverified(true);
      } else {
        notifications.show({ color: 'red', message: 'Invalid email or password' });
      }
    } finally {
      setBusy(false);
    }
  });

  const resend = () => {
    resendVerification(form.values.email.trim().toLowerCase())
      .then(() => notifications.show({ color: 'teal', message: 'Verification email sent' }))
      .catch(() => notifications.show({ color: 'red', message: 'Could not resend' }));
  };

  const onGoogle = (credential?: string) => {
    if (!credential) return;
    loginWithGoogle(credential)
      .then(() => navigate('/dashboard'))
      .catch(() => notifications.show({ color: 'red', message: 'Google sign-in failed' }));
  };

  return (
    <AuthShell title="Welcome back" tagline="Pick up right where you left off.">
      {unverified ? (
        <Alert color="copper" mb="md" title="Verify your email">
          Your email isn't verified yet. Check your inbox for the link, or{' '}
          <Anchor component="button" type="button" onClick={resend}>
            resend it
          </Anchor>
          .
        </Alert>
      ) : null}
      <form onSubmit={submit}>
        <Stack>
          <TextInput label="Email" {...form.getInputProps('email')} />
          <PasswordInput label="Password" {...form.getInputProps('password')} />
          <Button type="submit" loading={busy} fullWidth>
            Log in
          </Button>
        </Stack>
      </form>
      <Divider label="or" labelPosition="center" my="md" />
      <GoogleLogin
        onSuccess={(cred) => onGoogle(cred.credential)}
        onError={() => notifications.show({ color: 'red', message: 'Google sign-in failed' })}
      />
      <Anchor component={Link} to="/signup" size="sm" mt="md" display="block" ta="center">
        No account? Sign up
      </Anchor>
    </AuthShell>
  );
}
