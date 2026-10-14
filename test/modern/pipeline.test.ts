import 'fake-indexeddb/auto';
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { NebulaClient } from '../../extension/core/client';
import { CONFIRMED_TTL_MS } from '../../extension/core/matching';
import { Pipeline } from '../../extension/core/pipeline';
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
