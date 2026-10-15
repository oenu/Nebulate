import { afterEach, expect, test, vi } from 'vitest';
import { BrowsingController, videoCards } from '../../extension/core/browsing';
import { migratePreferences } from '../../extension/core/preferences';
import type { MatchDecision } from '../../extension/core/types';
import { YouTubeMetadata, youtubeIdentity } from '../../extension/core/youtube-metadata';

let controller: BrowsingController | undefined;
const href = 'https://www.youtube.com/feed/subscriptions';
function card(id = 'ka8kT_YOtU0') {
  document.body.innerHTML = `<yt-lockup-view-model><h3><a href="/watch?v=${id}">Cycling Made Difficult</a></h3><a href="/@NotJustBikes">Not Just Bikes</a></yt-lockup-view-model>`;
}
afterEach(() => {
  controller?.stop();
  controller = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

test('home/search/subscriptions/channel/recommendation adapters read current card metadata conservatively', () => {
  card();
  for (const url of [
    'https://www.youtube.com/',
    'https://www.youtube.com/results?search_query=test',
    href,
    'https://www.youtube.com/@NotJustBikes/videos',
    'https://www.youtube.com/watch?v=02eltxATsn4',
  ]) {
    expect(videoCards(document, url)[0]?.observation.channelHandle).toBe('@NotJustBikes');
  }
  document.querySelector('a[href^="/@"]')?.remove();
  expect(videoCards(document, href)[0]?.observation.channelHandle).toBeUndefined();
  expect(
    videoCards(document, 'https://www.youtube.com/@NotJustBikes/videos')[0]?.observation
      .channelHandle,
  ).toBe('@NotJustBikes');
});

test('card reuse and navigation discard delayed responses and cleanup owns all decoration', async () => {
  card();
  let release!: (decision: MatchDecision) => void;
  controller = new BrowsingController(
    document,
    () => href,
    () =>
      new Promise((r) => {
        release = r;
      }),
    () => true,
  );
  controller.start();
  controller.start();
  document.dispatchEvent(new Event('yt-navigate-start'));
  card('ABCDEFGHIJK');
  release({
    videoId: 'ka8kT_YOtU0',
    state: 'confirmed',
    url: 'https://nebula.tv/videos/test/',
    fingerprint: '',
    reason: 'fixture',
    checkedAtMs: 1,
    expiresAtMs: Number.MAX_SAFE_INTEGER,
  });
  await Promise.resolve();
  await Promise.resolve();
  expect(document.querySelector('.nebulate-card-link')).toBeNull();
});

test('matching cards get one accessible rocket, with no duplicates after repeated scans', async () => {
  card();
  controller = new BrowsingController(
    document,
    () => href,
    async (o) => ({
      videoId: o.videoId,
      state: 'confirmed',
      url: 'https://nebula.tv/videos/test/',
      fingerprint: '',
      reason: 'fixture',
      checkedAtMs: 1,
      expiresAtMs: Number.MAX_SAFE_INTEGER,
    }),
    () => true,
  );
  controller.start();
  await Promise.resolve();
  await Promise.resolve();
  await controller.sync();
  expect(document.querySelectorAll('.nebulate-card-link').length).toBe(1);
  controller.setPreferences({ ...migratePreferences(undefined), thumbnails: false });
  expect(document.querySelector('.nebulate-card-link')).toBeNull();
  controller.stop();
  expect(document.querySelector('.nebulate-card-confirmed')).toBeNull();
});

test('legacy local preferences preserve false values, validate colours and discard obsolete timestamps', () => {
  const preferences = migratePreferences(undefined, {
    addVideoButton: { value: false },
    preferNewTab: { value: true },
    buttonColor: { value: 'url(https://evil.invalid)' },
    lastUpdated: 123,
  });
  expect(preferences.showVideoButton).toBe(false);
  expect(preferences.preferNewTab).toBe(true);
  expect(preferences.buttonColor).toBe('#3EBBF3');
  expect('lastUpdated' in preferences).toBe(false);
});

test('YouTube metadata uses only public typed endpoints, deduplicates requests, and rejects unrelated author origins', async () => {
  let calls = 0;
  const youtube = new YouTubeMetadata(async (input, options) => {
    calls++;
    expect(String(input)).toContain('https://www.youtube.com/oembed?');
    expect(options?.credentials).toBe('omit');
    expect(options?.headers).toBeUndefined();
    return new Response(
      JSON.stringify({
        title: 'Cycling Made Difficult',
        author_url: 'https://www.youtube.com/@NotJustBikes',
      }),
    );
  });
  expect(
    (await Promise.all([youtube.observation('ka8kT_YOtU0'), youtube.observation('ka8kT_YOtU0')]))[0]
      ?.channelHandle,
  ).toBe('@NotJustBikes');
  expect(calls).toBe(1);
  expect(() => youtubeIdentity('https://www.youtube.com.evil.invalid/@NotJustBikes')).toThrow();
  await expect(youtube.observation('../arbitrary-url')).rejects.toThrow();
});

test('continuous page mutations cannot postpone the first visible card observation', async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
  let calls = 0;
  controller = new BrowsingController(
    document,
    () => href,
    async (observation) => {
      calls++;
      return {
        videoId: observation.videoId,
        state: 'no-match',
        reason: 'fixture',
        fingerprint: 'fixture',
        checkedAtMs: Date.now(),
        expiresAtMs: Number.MAX_SAFE_INTEGER,
      };
    },
    () => true,
  );
  controller.start();
  card();
  for (let i = 0; i < 12; i++) {
    document.body.append(document.createElement('span'));
    await vi.advanceTimersByTimeAsync(50);
  }
  expect(calls).toBe(1);
});
