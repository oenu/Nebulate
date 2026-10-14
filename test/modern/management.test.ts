import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { NebulaClient, type Session } from '../../extension/core/client';
import { Management } from '../../extension/core/management';
import { Pipeline } from '../../extension/core/pipeline';
import { LocalStore, SEED } from '../../extension/core/storage';
import { YouTubeMetadata } from '../../extension/core/youtube-metadata';

const json = (value: unknown) => new Response(JSON.stringify(value));
async function fixture() {
  const store = await LocalStore.open(`management-${crypto.randomUUID()}`);
  let account: Session = { generation: 'fixture', key: 'fixture-key', token: 'fixture-token' };
  const client = new NebulaClient(
    {
      read: async () => account,
      write: async (next) => {
        account = next;
      },
    },
    async (input) => {
      if (String(input).includes('logout')) return json({});
      return json({
        type: 'video_episode',
        id: 'video_episode:fixture',
        slug: 'fixture-video',
        title: 'A verified fixture video',
        channel_id: SEED.nebulaId,
        channel_slug: SEED.slug,
        published_at: '2026-10-14T00:00:00Z',
        duration: 100,
        share_url: 'https://nebula.tv/videos/fixture-video/',
      });
    },
  );
  const youtube = new YouTubeMetadata(async () =>
    json({
      title: 'A verified fixture video',
      author_url: 'https://www.youtube.com/@NotJustBikes',
    }),
  );
  const pipeline = new Pipeline(store, client);
  return { store, client, management: new Management(store, client, pipeline, youtube) };
}

test('manual confirmations and exclusions are explicit and cache/logout effects remain separate', async () => {
  const f = await fixture();
  await f.management.handle({
    type: 'correct-video',
    videoId: 'ka8kT_YOtU0',
    nebulaURL: 'https://nebula.tv/videos/fixture-video/',
  });
  expect((await f.store.db.get('decisions', 'ka8kT_YOtU0'))?.state).toBe('confirmed');
  await f.management.handle({ type: 'clear-cache' });
  expect(await f.store.db.count('overrides')).toBe(1);
  expect(await f.client.signedIn()).toBe(true);
  await f.client.logout();
  expect(await f.store.db.count('overrides')).toBe(1);
  expect(await f.client.signedIn()).toBe(false);
  await f.management.handle({ type: 'correct-video', videoId: 'ka8kT_YOtU0', nebulaURL: null });
  expect((await f.store.db.get('decisions', 'ka8kT_YOtU0'))?.state).toBe('no-match');
  await f.management.handle({ type: 'clear-cache', includeOverrides: true });
  expect(await f.store.db.count('overrides')).toBe(0);
  f.store.db.close();
});

test('correction URLs cannot escape Nebula and creator mappings require explicit verification', async () => {
  const f = await fixture();
  await expect(
    f.management.handle({
      type: 'correct-video',
      videoId: 'ka8kT_YOtU0',
      nebulaURL: 'https://evil.invalid/',
    }),
  ).rejects.toThrow('invalid-video-url');
  await expect(f.management.handle({ type: 'map-creator', confirmed: false })).rejects.toThrow(
    'creator-confirmation-required',
  );
  expect(await f.store.db.count('overrides')).toBe(0);
  f.store.db.close();
});
