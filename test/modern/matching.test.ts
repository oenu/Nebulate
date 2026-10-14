import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import {
  CONFIRMED_TTL_MS,
  isFresh,
  matchVideo,
  NEGATIVE_TTL_MS,
  resolveCreator,
  titleScore,
} from '../../extension/core/matching';
import { parsePage, parseVideo, validateCatalogueURL } from '../../extension/core/metadata';
import { SEED } from '../../extension/core/storage';
import type { NebulaVideo, Observation } from '../../extension/core/types';

const fixture = JSON.parse(readFileSync('test/nebula/fixtures/notjustbikes.json', 'utf8'));
const videos: NebulaVideo[] = fixture.videos.map((v: Record<string, unknown>) =>
  parseVideo({
    type: 'video_episode',
    id: v.id,
    slug: v.slug,
    title: v.title,
    channel_id: v.channelId,
    channel_slug: v.channelSlug,
    published_at: v.publishedAt,
    duration: v.durationSeconds,
    share_url: v.url,
  }),
);
const example: Observation = {
  videoId: 'ka8kT_YOtU0',
  title: "Cycling Made Difficult (but it's getting better!)",
  channelId: SEED.youtubeChannelId,
};
const now = Date.parse('2026-10-14T12:00:00Z');
const episode = videos.find((v) => v.slug.includes('cycling-made-difficult')) as NebulaVideo;

describe('conservative local matching', () => {
  test('exact title and confirmed creator match, including punctuation edits', () => {
    expect(matchVideo(example, SEED, videos, now).url).toBe(episode.url);
    expect(
      matchVideo(
        { ...example, title: 'Cycling Made Difficult — but it’s getting better' },
        SEED,
        videos,
        now,
      ).state,
    ).toBe('confirmed');
  });
  test('near titles require supporting duration and publication date', () => {
    const edited = { ...example, title: "Cycling Made Difficult (but it's getting much better!)" };
    expect(matchVideo(edited, SEED, videos, now).state).toBe('ambiguous');
    expect(
      matchVideo(
        {
          ...edited,
          publishedAtMs: episode.publishedAtMs + 86400000,
          durationSeconds: episode.durationSeconds + 10,
        },
        SEED,
        videos,
        now,
      ).state,
    ).toBe('confirmed');
  });
  test('unverified and unrelated creators never match by title or feed membership', () => {
    expect(matchVideo(example, undefined, videos, now).state).toBe('unknown');
    expect(
      resolveCreator({ ...example, channelId: 'UCunrelated', channelHandle: '@notjustbikes' }, [
        SEED,
      ]),
    ).toBeUndefined();
    expect(
      resolveCreator({ ...example, channelId: undefined, channelHandle: '@NotJustBikes' }, [SEED]),
    ).toEqual(SEED);
    expect(matchVideo({ ...example, title: videos[0]?.title ?? '' }, SEED, videos, now).state).toBe(
      'no-match',
    );
  });
  test('duplicates, short titles and conflicting publication dates remain ambiguous', () => {
    expect(
      matchVideo(
        example,
        SEED,
        [...videos, { ...episode, id: 'duplicate', url: 'https://nebula.tv/videos/duplicate/' }],
        now,
      ).state,
    ).toBe('ambiguous');
    expect(
      matchVideo(
        { ...example, publishedAtMs: episode.publishedAtMs - 100 * 86400000 },
        SEED,
        videos,
        now,
      ).state,
    ).toBe('ambiguous');
  });
  test('score zero is retained and negative matches expire to allow publication delays', () => {
    expect(titleScore('unrelated topic', 'cycling made difficult')).toBe(0);
    const decision = matchVideo(
      { ...example, title: 'Deliberately unrelated synthetic fixture' },
      SEED,
      videos,
      now,
    );
    expect(decision.score).toBe(0);
    expect(decision.state).toBe('no-match');
    expect(decision.expiresAtMs).toBe(now + NEGATIVE_TTL_MS);
    expect(
      isFresh(
        decision,
        { ...example, title: 'Deliberately unrelated synthetic fixture' },
        now + NEGATIVE_TTL_MS,
      ),
    ).toBe(false);
    const confirmed = matchVideo(example, SEED, videos, now);
    expect(confirmed.expiresAtMs).toBe(now + CONFIRMED_TTL_MS);
    expect(isFresh(confirmed, { ...example, title: 'Edited title' }, now)).toBe(false);
  });
  test('explicit links need a matching creator; manual confirmations and exclusions survive refresh', () => {
    expect(
      matchVideo(
        { ...example, title: 'Edited title', nebulaURLs: [episode.url] },
        SEED,
        videos,
        now,
      ).state,
    ).toBe('confirmed');
    expect(
      matchVideo({ ...example, nebulaURLs: [videos[0]?.url ?? ''] }, SEED, videos, now).url,
    ).not.toBe(videos[0]?.url);
    const override = {
      videoId: example.videoId,
      observation: example,
      nebulaId: episode.id,
      url: episode.url,
      updatedAtMs: now,
    };
    expect(matchVideo(example, SEED, [], now, override).reason).toBe('manual');
    expect(
      matchVideo(example, SEED, videos, now, { ...override, nebulaId: null, url: undefined }).state,
    ).toBe('no-match');
  });
});

test('response boundaries reject malformed metadata and unsafe pagination', () => {
  for (const destination of [
    'https://evil.invalid/',
    'https://content.api.nebula.app/video_channels/other/',
    'https://content.api.nebula.app/video_channels/notjustbikes/?page_size=999',
    'https://content.api.nebula.app/video_channels/notjustbikes/?key=secret',
  ]) {
    expect(() => validateCatalogueURL(destination, SEED.slug)).toThrow();
  }
  expect(() => parsePage({ results: [], next: 'https://evil.invalid/' }, SEED.slug)).toThrow();
  expect(() => parseVideo({ ...episode, published_at: 'invalid' })).toThrow();
});
