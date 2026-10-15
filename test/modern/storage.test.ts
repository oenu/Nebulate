import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { expect, test } from 'vitest';
import { matchVideo } from '../../extension/core/matching';
import { LocalStore, SEED } from '../../extension/core/storage';
import type { NebulaVideo, Observation } from '../../extension/core/types';

const observation: Observation = {
  videoId: 'ka8kT_YOtU0',
  title: 'Cycling Made Difficult',
  channelId: SEED.youtubeChannelId,
};
const video: NebulaVideo = {
  id: 'video_episode:fixture',
  slug: 'cycling',
  url: 'https://nebula.tv/videos/cycling/',
  title: observation.title,
  creatorId: SEED.nebulaId,
  creatorSlug: SEED.slug,
  publishedAtMs: 1,
  durationSeconds: 100,
};
const store = () => LocalStore.open(`test-${crypto.randomUUID()}`);

test('version 1 upgrades preserve data and add lookup indexes/stores', async () => {
  const name = `migration-${crypto.randomUUID()}`;
  const legacy = await openDB(name, 1, {
    upgrade(db) {
      db.createObjectStore('videos', { keyPath: 'id' });
      db.createObjectStore('decisions', { keyPath: 'videoId' });
    },
  });
  await legacy.put('videos', video);
  legacy.close();
  const upgraded = await LocalStore.open(name);
  expect(await upgraded.db.getAllFromIndex('videos', 'creator', SEED.nebulaId)).toEqual([video]);
  expect(await upgraded.db.get('creators', SEED.youtubeChannelId)).toMatchObject({
    youtubeChannelId: SEED.youtubeChannelId,
    nebulaId: SEED.nebulaId,
    slug: SEED.slug,
  });
  expect(upgraded.db.objectStoreNames.contains('jobs')).toBe(true);
  upgraded.db.close();
});

test('a different automatic destination requires correction and stale requests cannot overwrite newer decisions', async () => {
  const s = await store();
  const first = matchVideo(observation, SEED, [video], 100);
  await s.saveDecision(first);
  expect(
    (await s.saveDecision({ ...first, url: 'https://nebula.tv/videos/other/', checkedAtMs: 200 }))
      .state,
  ).toBe('ambiguous');
  expect((await s.saveDecision(first)).checkedAtMs).toBe(200);
  s.db.close();
});

test('atomic overrides survive refresh, cache clearing and database reopen', async () => {
  const s = await store();
  const decision = matchVideo(observation, SEED, [video], 100);
  const override = {
    videoId: observation.videoId,
    observation,
    nebulaId: video.id,
    url: video.url,
    updatedAtMs: 110,
  };
  await s.correct(override, { ...decision, reason: 'manual' });
  expect((await s.saveDecision({ ...decision, state: 'no-match', checkedAtMs: 200 })).reason).toBe(
    'manual',
  );
  await s.clearCache();
  expect(await s.db.get('overrides', observation.videoId)).toEqual(override);
  const name = s.db.name;
  s.db.close();
  const reopened = await LocalStore.open(name);
  expect(await reopened.db.get('overrides', observation.videoId)).toEqual(override);
  await reopened.clearCache(true);
  expect(await reopened.db.count('overrides')).toBe(0);
  reopened.db.close();
});

test('retention removes old automatic results and preserves manual corrections', async () => {
  const s = await store();
  const decision = matchVideo(observation, SEED, [], 1);
  await s.db.put('decisions', decision);
  await s.db.put('decisions', { ...decision, videoId: 'manual', reason: 'manual' });
  await s.prune(100 * 86400000);
  expect(await s.db.get('decisions', observation.videoId)).toBeUndefined();
  expect((await s.db.get('decisions', 'manual'))?.reason).toBe('manual');
  s.db.close();
});
