import 'fake-indexeddb/auto';
import { expect, test } from 'vitest';
import { CREATOR_DIRECTORY, REGISTRY_MAPPINGS } from '../../extension/core/creators';
import { LocalStore } from '../../extension/core/storage';
import { parseChannelVideos, parseYouTubeChannel } from '../../extension/core/youtube-channel';
import { YouTubeMetadata } from '../../extension/core/youtube-metadata';

const sam = {
  channelId: 'UC1DTYW241WD64ah5BFWn4JA',
  handle: '@SamONellaAcademy',
  title: "Sam O'Nella Academy",
};
const html = `<script>var ytInitialData={"unrelated":{"channelId":"UCaaaaaaaaaaaaaaaaaaaaaa"},"metadata":{"channelMetadataRenderer":${JSON.stringify({ externalId: sam.channelId, title: sam.title, vanityChannelUrl: `http://www.youtube.com/${sam.handle}` })}}};</script>`;

test('channel verification reads the owner metadata rather than unrelated recommendations and works without RSS', async () => {
  expect(parseYouTubeChannel(html)).toEqual(sam);
  const paths: string[] = [];
  const youtube = new YouTubeMetadata(async (input) => {
    paths.push(new URL(String(input)).pathname);
    return new Response(html);
  });
  await youtube.verifyChannel(sam.channelId, sam.handle);
  expect(paths).toEqual([`/channel/${sam.channelId}`]);
  await expect(youtube.verifyChannel(sam.channelId, '@Impostor')).rejects.toThrow(
    'channel-verification-failed',
  );
  expect(() =>
    parseYouTubeChannel(html.replace('www.youtube.com', 'www.youtube.com.evil.invalid')),
  ).toThrow();
});

test('registry discovery reads current lockup video titles and excludes playlists', () => {
  const page = JSON.stringify({
    items: [
      {
        lockupViewModel: {
          contentType: 'LOCKUP_CONTENT_TYPE_VIDEO',
          contentId: 'ABCDEFGHIJK',
          metadata: { lockupMetadataViewModel: { title: { content: 'A public video title' } } },
        },
      },
      {
        lockupViewModel: {
          contentType: 'LOCKUP_CONTENT_TYPE_PLAYLIST',
          contentId: 'PLabcdefghijk',
          metadata: { lockupMetadataViewModel: { title: { content: 'A playlist title' } } },
        },
      },
    ],
  });
  expect(parseChannelVideos(page)).toEqual([{ id: 'ABCDEFGHIJK', title: 'A public video title' }]);
});

test("the complete directory has unique identities and verified mappings include Sam O'Nella", async () => {
  expect(CREATOR_DIRECTORY.length).toBeGreaterThan(250);
  expect(new Set(CREATOR_DIRECTORY.map((entry) => entry.id)).size).toBe(CREATOR_DIRECTORY.length);
  expect(new Set(REGISTRY_MAPPINGS.map((mapping) => mapping.youtubeChannelId)).size).toBe(
    REGISTRY_MAPPINGS.length,
  );
  const mapping = REGISTRY_MAPPINGS.find((mapping) => mapping.slug === 'samonella');
  expect(mapping?.youtubeChannelId).toBe(sam.channelId);
  expect(mapping?.youtubeHandle).toBe(sam.handle);
  if (!mapping) throw new Error('Missing verified Sam mapping');
  const store = await LocalStore.open(`directory-${crypto.randomUUID()}`);
  expect((await store.db.get('creators', sam.channelId))?.slug).toBe('samonella');
  const manual = { ...mapping, slug: 'my-corrected-creator', source: 'manual' as const };
  await store.db.put('creators', manual);
  const name = store.db.name;
  store.db.close();
  const reopened = await LocalStore.open(name);
  expect(await reopened.db.get('creators', sam.channelId)).toEqual(manual);
  reopened.db.close();
});

test('a manual creator reassignment takes priority over bundled mappings and clears obsolete automatic decisions', async () => {
  const store = await LocalStore.open(`manual-directory-${crypto.randomUUID()}`);
  const old = await store.db.get('creators', sam.channelId);
  if (!old) throw new Error('Missing Sam mapping');
  const corrected = {
    ...old,
    youtubeChannelId: 'UCaaaaaaaaaaaaaaaaaaaaaa',
    youtubeHandle: '@CorrectedSam',
    source: 'manual' as const,
  };
  await store.db.put('creators', corrected);
  await store.db.put('decisions', {
    videoId: 'ABCDEFGHIJK',
    creatorSlug: old.slug,
    fingerprint: 'fixture',
    state: 'confirmed',
    reason: 'fixture',
    checkedAtMs: 1,
    expiresAtMs: 1000000,
  });
  const name = store.db.name;
  store.db.close();
  const reopened = await LocalStore.open(name);
  expect(await reopened.db.get('creators', sam.channelId)).toBeUndefined();
  expect(await reopened.db.get('creators', corrected.youtubeChannelId)).toEqual(corrected);
  expect(await reopened.db.get('decisions', 'ABCDEFGHIJK')).toBeUndefined();
  reopened.db.close();
});
