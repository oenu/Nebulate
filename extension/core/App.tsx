import { Settings } from './Settings';
import { reasonLabel } from './status';
import '@mantine/core/styles.css';
import {
  Button,
  Card,
  Container,
  MantineProvider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';
import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import './app.css';

export function App({ compact = false }: { compact?: boolean }) {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const status = useCallback(async () => {
    const result = await browser.runtime.sendMessage({ type: 'status' });
    setSignedIn(Boolean(result.signedIn));
  }, []);
  useEffect(() => {
    void status().catch(() => setNotice('Background unavailable. Reload the extension.'));
  }, [status]);
  const signIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNotice('Signing in…');
    const request = { type: 'sign-in', email, password };
    setPassword('');
    setEmail('');
    try {
      const result = await browser.runtime.sendMessage(request);
      setNotice(
        result.ok
          ? 'Signed in. Your password was not saved.'
          : reasonLabel(result.error ?? 'unavailable'),
      );
      await status();
    } catch {
      setNotice('Sign-in unavailable. Try again.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <MantineProvider defaultColorScheme="dark" theme={{ primaryColor: 'cyan' }}>
      <Container size="sm" className={compact ? 'nebulate-shell compact' : 'nebulate-shell'}>
        <Stack>
          <Title order={1}>
            <IconRocket aria-hidden /> Nebulate
          </Title>
          <Card withBorder>
            <Text>Find your creators on Nebula. Matches stay on this device.</Text>
            <Text size="sm">
              Sign-in details go directly to Nebula. Public video lookups go to YouTube. Matches and
              preferences stay on this device.
            </Text>
            <Text size="sm">
              {signedIn ? 'Signed in for this browser session' : 'Public catalogue · Not signed in'}
            </Text>
          </Card>
          {signedIn ? (
            <Button
              disabled={busy}
              onClick={async () => {
                const result = await browser.runtime.sendMessage({ type: 'logout' });
                setNotice(
                  result.revoked
                    ? 'Signed out.'
                    : 'Signed out locally. Server logout could not be reached.',
                );
                await status();
              }}
            >
              Sign out
            </Button>
          ) : (
            <form onSubmit={signIn} autoComplete="off">
              <Stack>
                <TextInput
                  label="Nebula email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  required
                  autoComplete="off"
                />
                <PasswordInput
                  label="Nebula password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                  required
                  autoComplete="off"
                />
                <Button type="submit" loading={busy}>
                  Sign in
                </Button>
              </Stack>
            </form>
          )}
          <Text role="status" size="sm">
            {notice}
          </Text>
          {!compact && <Settings />}
          {compact && (
            <Button variant="subtle" onClick={() => void browser.runtime.openOptionsPage()}>
              Open settings
            </Button>
          )}
        </Stack>
      </Container>
    </MantineProvider>
  );
}
