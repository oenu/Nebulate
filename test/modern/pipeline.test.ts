import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { expect, test, vi } from 'vitest';
import { NebulaClient } from '../../extension/core/client';
import { CONFIRMED_TTL_MS } from '../../extension/core/matching';
import { Pipeline } from '../../extension/core/pipeline';
import { CREATOR_TTL_MS } from '../../extension/core/scheduler';
import { LocalStore, SEED } from '../../extension/core/storage';
import type { Observation } from '../../extension/core/types';

const fixture = JSON.parse(readFileSync('test/nebula/fixtures/notjustbikes.json', 'utf8'));
const observation: Observation = {
  videoId: 'ka8kT_YOtU0',
  title: "Cycling Made Difficult (but it's getting better!)",
  channelId: SEED.youtubeChannelId,
};
const json = (data: unknown) => new Response(JSON.stringify(data));
function fixtureClient() {
  let requests = 0;
  let offline = false;
  const client = new NebulaClient(
    { read: async () => ({ generation: 'fixture' }), write: async () => {} },
    async (input) => {
      requests++;
      if (offline) throw new Error('fixture-offline');
      if (!String(input).includes('video_episodes'))
        return json({
          type: 'video_channel',
          id: SEED.nebulaId,
          slug: SEED.slug,
          title: SEED.title,
        });
      return json({
        next: null,
        results: fixture.videos.map((v: Record<string, unknown>) => ({
          type: 'video_episode',
          id: v.id,
          slug: v.slug,
          title: v.title,
          channel_id: v.channelId,
          channel_slug: v.channelSlug,
          published_at: v.publishedAt,
          duration: v.durationSeconds,
          share_url: v.url,
        })),
      });
    },
  );
  return {
    client,
    requests: () => requests,
    goOffline: () => {
      offline = true;
    },
  };
}

test('watch observations deduplicate creator fetches and cache exact results without a helper', async () => {
  const store = await LocalStore.open(`pipeline-${crypto.randomUUID()}`);
  const fixture = fixtureClient();
  const pipeline = new Pipeline(store, fixture.client, () => 1000);
  const decisions = await Promise.all([
    pipeline.observe(observation),
    pipeline.observe(observation),
  ]);
  expect(decisions.map((d) => d.state)).toEqual(['confirmed', 'confirmed']);
  expect(fixture.requests()).toBe(2);
  await pipeline.observe(observation);
  expect(fixture.requests()).toBe(2);
  store.db.close();
});

test('unverified creators make no requests; failure remains retryable and confirmed cache stays usable offline', async () => {
  const store = await LocalStore.open(`offline-${crypto.randomUUID()}`);
  const fixture = fixtureClient();
  let now = 1000;
  const pipeline = new Pipeline(store, fixture.client, () => now);
  expect((await pipeline.observe({ ...observation, channelId: 'UCunknown' })).state).toBe(
    'unknown',
  );
  expect(fixture.requests()).toBe(0);
  await pipeline.observe(observation);
  fixture.goOffline();
  now += CONFIRMED_TTL_MS;
  expect((await pipeline.observe(observation)).reason).toBe('cached-offline');
  const failed = await pipeline.observe({
    ...observation,
    videoId: 'ABCDEFGHIJK',
    title: 'Synthetic unmatched fixture',
  });
  expect(failed.state).toBe('retryable-error');
  expect(failed.url).toBeUndefined();
  store.db.close();
});

test('encountering a cached video refreshes its creator after four hours without waiting for the seven-day match expiry', async () => {
  const store = await LocalStore.open(`cached-creator-${crypto.randomUUID()}`);
  const fixture = fixtureClient();
  let now = 1000;
  const pipeline = new Pipeline(store, fixture.client, () => now);
  const first = await pipeline.observe(observation);
  expect(fixture.requests()).toBe(2);
  now += CREATOR_TTL_MS + 1;
  const cached = await pipeline.observe(observation);
  expect(cached.checkedAtMs).toBe(first.checkedAtMs);
  await vi.waitFor(async () => {
    expect(fixture.requests()).toBe(4);
    expect((await store.db.get('jobs', SEED.slug))?.status).toBe('idle');
  });
  await Promise.all([pipeline.observe(observation), pipeline.observe(observation)]);
  expect(fixture.requests()).toBe(4);
  store.db.close();
});

test('cached encounters honor failure backoff and manual video decisions do not suppress creator fetching', async () => {
  const store = await LocalStore.open(`cached-backoff-${crypto.randomUUID()}`);
  const fixture = fixtureClient();
  let now = 1000;
  const pipeline = new Pipeline(store, fixture.client, () => now);
  const first = await pipeline.observe(observation);
  await store.correct(
    {
      videoId: observation.videoId,
      observation,
      nebulaId: first.nebulaId as string,
      url: first.url,
      updatedAtMs: now,
    },
    { ...first, reason: 'manual' },
  );
  fixture.goOffline();
  now += CREATOR_TTL_MS + 1;
  expect((await pipeline.observe(observation)).reason).toBe('manual');
  await vi.waitFor(async () =>
    expect((await store.db.get('jobs', SEED.slug))?.status).toBe('retry'),
  );
  expect(fixture.requests()).toBe(3);
  await Promise.all([pipeline.observe(observation), pipeline.observe(observation)]);
  expect(fixture.requests()).toBe(3);
  store.db.close();
});

test('a newly available catalogue match replaces a cached negative after the automatic creator update', async () => {
  const store = await LocalStore.open(`new-release-${crypto.randomUUID()}`);
  const fixture = fixtureClient();
  let now = 1000;
  let updates = 0;
  const pipeline = new Pipeline(
    store,
    fixture.client,
    () => now,
    () => {
      updates++;
    },
  );
  const original = await pipeline.observe(observation);
  now += CREATOR_TTL_MS + 1;
  await store.db.put('decisions', {
    ...original,
    state: 'no-match',
    reason: 'no-candidate',
    url: undefined,
    nebulaId: undefined,
    checkedAtMs: now - 1,
    expiresAtMs: now + 15 * 60000,
  });
  expect((await pipeline.observe(observation)).state).toBe('no-match');
  await vi.waitFor(() => expect(updates).toBe(2));
  expect((await pipeline.observe(observation)).state).toBe('confirmed');
  expect(fixture.requests()).toBe(4);
  store.db.close();
});
