import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Anchor, Button, Divider, PasswordInput, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { GoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '@/auth/authStore';
import { AuthShell } from '@/pages/AuthShell';

export function SignupPage() {
  const signup = useAuthStore((s) => s.signup);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const form = useForm({
    initialValues: { name: '', email: '', password: '' },
    validate: {
      name: (v) => (v.trim().length >= 2 ? null : 'Enter your name'),
      email: (v) => (/^\S+@\S+$/.test(v) ? null : 'Invalid email'),
      password: (v) => (v.length >= 8 ? null : 'Min 8 characters'),
    },
  });

  const submit = form.onSubmit(async (values) => {
    setBusy(true);
    try {
      await signup(values);
      void navigate('/');
    } catch {
      notifications.show({ color: 'red', message: 'Could not sign up (email may be taken)' });
    } finally {
      setBusy(false);
    }
  });

  const onGoogle = (credential?: string) => {
    if (!credential) return;
    loginWithGoogle(credential)
      .then(() => navigate('/'))
      .catch(() => notifications.show({ color: 'red', message: 'Google sign-in failed' }));
  };

  return (
    <AuthShell
      title="Create your account"
      tagline="Start turning invoices into answers in minutes."
    >
      <form onSubmit={submit}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps('name')} />
          <TextInput label="Email" {...form.getInputProps('email')} />
          <PasswordInput label="Password" {...form.getInputProps('password')} />
          <Button type="submit" loading={busy} fullWidth>
            Sign up
          </Button>
        </Stack>
      </form>
      <Divider label="or" labelPosition="center" my="md" />
      <GoogleLogin
        onSuccess={(cred) => onGoogle(cred.credential)}
        onError={() => notifications.show({ color: 'red', message: 'Google sign-in failed' })}
      />
      <Anchor component={Link} to="/login" size="sm" mt="md" display="block" ta="center">
        Have an account? Log in
      </Anchor>
    </AuthShell>
  );
}
