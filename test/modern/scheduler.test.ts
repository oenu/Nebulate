import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { NebulaClient } from '../../extension/core/client';
import { pageURL } from '../../extension/core/metadata';
import { LEASE_MS, MAX_PAGES, RefreshScheduler } from '../../extension/core/scheduler';
import { LocalStore, SEED } from '../../extension/core/storage';
import type { RefreshJob } from '../../extension/core/types';

const json = (value: unknown) => new Response(JSON.stringify(value));
const port = { read: async () => ({ generation: 'fixture' }), write: async () => {} };
const creator = { type: 'video_channel', id: SEED.nebulaId, slug: SEED.slug, title: SEED.title };
const db = () => LocalStore.open(`scheduler-${crypto.randomUUID()}`);

test('another worker respects a live lease and resumes a persisted checkpoint when it expires', async () => {
  const store = await db();
  let now = 1000;
  const urls: string[] = [];
  const checkpoint: RefreshJob = {
    slug: SEED.slug,
    generation: 'interrupted',
    status: 'refreshing',
    nextURL: `${pageURL(SEED.slug)}&offset=100`,
    pages: 1,
    startedAtMs: now,
    updatedAtMs: now,
    leaseUntilMs: now + LEASE_MS,
    retryAtMs: 0,
    complete: false,
  };
  await store.db.put('jobs', checkpoint);
  const client = new NebulaClient(port, async (input) => {
    urls.push(String(input));
    return json(String(input).includes('video_episodes') ? { results: [], next: null } : creator);
  });
  const scheduler = new RefreshScheduler(store, client, () => now);
  expect((await scheduler.refresh(SEED)).status).toBe('refreshing');
  expect(urls).toHaveLength(0);
  now += LEASE_MS;
  const resumed = await new RefreshScheduler(store, client, () => now).refresh(SEED);
  expect(resumed.complete).toBe(true);
  expect(resumed.pages).toBe(2);
  expect(urls[1]).toContain('offset=100');
  store.db.close();
});

test('rate-limit backoff persists and an explicit refresh still respects Retry-After', async () => {
  const store = await db();
  let count = 0;
  let now = 1000;
  const client = new NebulaClient(port, async () => {
    count++;
    return new Response('', { status: 429, headers: { 'Retry-After': '120' } });
  });
  const scheduler = new RefreshScheduler(store, client, () => now);
  const limited = await scheduler.refresh(SEED);
  expect(limited.retryAtMs).toBe(now + 120000);
  await scheduler.refresh(SEED, true);
  expect(count).toBe(1);
  now += 120000;
  await new RefreshScheduler(store, client, () => now).recover();
  expect(count).toBe(2);
  store.db.close();
});

test('a completed creator fetch invalidates automatic negatives and notifies tabs once while preserving confirmations and corrections', async () => {
  const store = await db();
  const base = {
    videoId: 'ABCDEFGHIJK',
    fingerprint: 'fixture',
    creatorSlug: SEED.slug,
    state: 'no-match' as const,
    reason: 'no-candidate',
    checkedAtMs: 1,
    expiresAtMs: 1000000,
  };
  await store.db.put('decisions', base);
  await store.db.put('decisions', { ...base, videoId: 'manual', reason: 'manual' });
  await store.db.put('decisions', { ...base, videoId: 'confirmed', state: 'confirmed' });
  let notifications = 0;
  const client = new NebulaClient(port, async (input) =>
    json(String(input).includes('video_episodes') ? { results: [], next: null } : creator),
  );
  const scheduler = new RefreshScheduler(
    store,
    client,
    () => 1000,
    () => {
      notifications++;
    },
  );
  await scheduler.refresh(SEED);
  expect(await store.db.get('decisions', base.videoId)).toBeUndefined();
  expect((await store.db.get('decisions', 'manual'))?.reason).toBe('manual');
  expect((await store.db.get('decisions', 'confirmed'))?.state).toBe('confirmed');
  expect(notifications).toBe(1);
  await scheduler.refresh(SEED);
  expect(notifications).toBe(1);
  store.db.close();
});

test('cache clear invalidates an in-flight page generation so late writes cannot restore it', async () => {
  const store = await db();
  let release!: () => void;
  let started!: () => void;
  const pending = new Promise<void>((r) => {
    release = r;
  });
  const pageStarted = new Promise<void>((r) => {
    started = r;
  });
  const client = new NebulaClient(port, async (input) => {
    if (!String(input).includes('video_episodes')) return json(creator);
    started();
    await pending;
    return json({ results: [], next: null });
  });
  const run = new RefreshScheduler(store, client).refresh(SEED);
  await pageStarted;
  await store.clearCache();
  release();
  expect((await run).error).toBe('refresh-cancelled');
  expect(await store.db.count('jobs')).toBe(0);
  expect(await store.db.count('videos')).toBe(0);
  store.db.close();
});

test('pagination is bounded, incomplete catalogues stay explicit, and fresh jobs avoid repeated downloads', async () => {
  const store = await db();
  let pages = 0;
  const client = new NebulaClient(port, async (input) => {
    if (!String(input).includes('video_episodes')) return json(creator);
    pages++;
    return json({ results: [], next: `${pageURL(SEED.slug)}&offset=${pages * 100}` });
  });
  const scheduler = new RefreshScheduler(store, client, () => 1000);
  const result = await scheduler.refresh(SEED);
  expect(pages).toBe(MAX_PAGES);
  expect(result.complete).toBe(false);
  await scheduler.refresh(SEED);
  expect(pages).toBe(MAX_PAGES);
  store.db.close();
});

test('creator jobs bound concurrent service requests across several mappings', async () => {
  const store = await db();
  let active = 0;
  let peak = 0;
  const mappings = ['first', 'second', 'third', 'fourth'].map((slug, i) => ({
    ...SEED,
    slug,
    nebulaId: `video_channel:${i}`,
  }));
  const client = new NebulaClient(port, async (input) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    const mapping = mappings.find((m) => String(input).includes(`/video_channels/${m.slug}/`));
    return json(
      String(input).includes('video_episodes')
        ? { results: [], next: null }
        : { ...creator, slug: mapping?.slug, id: mapping?.nebulaId },
    );
  });
  const scheduler = new RefreshScheduler(store, client);
  await Promise.all(mappings.map((mapping) => scheduler.refresh(mapping)));
  expect(peak).toBeLessThanOrEqual(2);
  store.db.close();
});
