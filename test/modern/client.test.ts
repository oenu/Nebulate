import { expect, test, vi } from 'vitest';
import { NebulaClient, ServiceError, type Session } from '../../extension/core/client';

function memorySession(initial: Session = { generation: 'initial' }) {
  let value = initial;
  return {
    read: async () => ({ ...value }),
    write: async (next: Session) => {
      value = { ...next };
    },
  };
}
const json = (value: unknown) => new Response(JSON.stringify(value));

test('default browser fetch retains its global receiver', async () => {
  vi.stubGlobal('fetch', function (this: typeof globalThis) {
    expect(this).toBe(globalThis);
    return Promise.resolve(json({ ok: true }));
  });
  try {
    expect(await new NebulaClient(memorySession()).catalogue('notjustbikes')).toEqual({ ok: true });
  } finally {
    vi.unstubAllGlobals();
  }
});

test('403/401 catalogue bearer failures renew once and concurrent renewals deduplicate', async () => {
  const session = memorySession({
    generation: 'signed-in',
    key: 'fixture-key',
    token: 'expired-fixture',
  });
  let authorizations = 0;
  const client = new NebulaClient(session, async (input, options) => {
    if (String(input).includes('authorization/')) {
      authorizations++;
      return json({ token: 'renewed-fixture' });
    }
    const headers = options?.headers as Record<string, string>;
    expect(options?.redirect).toBe('error');
    return headers.Authorization === 'Bearer renewed-fixture'
      ? json({ ok: true })
      : new Response('', { status: 403 });
  });
  expect(
    await Promise.all([client.catalogue('notjustbikes'), client.catalogue('notjustbikes')]),
  ).toEqual([{ ok: true }, { ok: true }]);
  expect(authorizations).toBe(1);
  expect((await session.read()).token).toBe('renewed-fixture');
});

test('persistent auth failure stops after one renewal; logout clears local state when offline', async () => {
  const session = memorySession({ generation: 'signed-in', key: 'fixture-key', token: 'expired' });
  let count = 0;
  const client = new NebulaClient(session, async (input) => {
    count++;
    return String(input).includes('authorization/')
      ? json({ token: 'still-denied' })
      : new Response('', { status: 401 });
  });
  await expect(client.catalogue('notjustbikes')).rejects.toBeInstanceOf(ServiceError);
  expect(count).toBe(3);
  expect(await client.logout()).toBe(false);
  expect((await session.read()).key).toBeUndefined();
});

test('logout during renewal prevents a delayed token from restoring the session', async () => {
  const session = memorySession({ generation: 'signed-in', key: 'fixture-key', token: 'expired' });
  let release!: () => void;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  let renewing!: () => void;
  const renewalStarted = new Promise<void>((r) => {
    renewing = r;
  });
  const client = new NebulaClient(session, async (input) => {
    if (String(input).includes('logout/')) return json({});
    if (String(input).includes('authorization/')) {
      renewing();
      await pending;
      return json({ token: 'late-token' });
    }
    return new Response('', { status: 403 });
  });
  const request = client.catalogue('notjustbikes');
  await renewalStarted;
  await client.logout();
  release();
  await expect(request).rejects.toThrow('sign-in-required');
  expect((await session.read()).token).toBeUndefined();
});

test('network errors and rate limits contain sanitized codes and bounded retry delay', async () => {
  const client = new NebulaClient(
    memorySession(),
    async () => new Response('private payload', { status: 429, headers: { 'Retry-After': '120' } }),
  );
  await expect(client.catalogue('notjustbikes')).rejects.toMatchObject({
    code: 'rate-limited',
    retryMs: 120000,
  });
  const offline = new NebulaClient(memorySession(), async () => {
    throw new Error('private request');
  });
  await expect(offline.catalogue('notjustbikes')).rejects.toThrow('offline-or-network');
  await expect(client.catalogue('notjustbikes', 'https://evil.invalid/')).rejects.toThrow();
});
