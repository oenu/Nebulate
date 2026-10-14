import { afterEach, expect, test, vi } from 'vitest';
import { parseObservation } from '../../extension/core/messages';
import type { MatchDecision, Observation } from '../../extension/core/types';
import { WatchController } from '../../extension/core/watch';
import { watchObservation } from '../../extension/core/youtube';

const id = 'ka8kT_YOtU0';
let href = `https://www.youtube.com/watch?v=${id}`;
let controller: WatchController | undefined;
function page(videoId = id) {
  href = `https://www.youtube.com/watch?v=${videoId}`;
  document.body.innerHTML = `<ytd-watch-flexy video-id="${videoId}"><div id="player"><div class="ytp-right-controls"></div></div><ytd-watch-metadata><div id="title"><h1>Cycling Made Difficult</h1></div><div id="owner"><a href="/@NotJustBikes">Not Just Bikes</a></div></ytd-watch-metadata></ytd-watch-flexy>`;
}
const decision = (o: Observation): MatchDecision => ({
  videoId: o.videoId,
  state: 'confirmed',
  fingerprint: '',
  reason: 'fixture',
  checkedAtMs: 1,
  expiresAtMs: Number.MAX_SAFE_INTEGER,
  url: 'https://nebula.tv/videos/cycling/',
});
afterEach(() => {
  controller?.stop();
  controller = undefined;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

test('watch adapter uses current URL/video marker and validated creator identity', () => {
  page();
  expect(watchObservation(document, href)?.channelHandle).toBe('@NotJustBikes');
  const canonical = document.createElement('link');
  canonical.rel = 'canonical';
  canonical.href = `https://www.youtube.com/shorts/${id}`;
  document.head.append(canonical);
  expect(watchObservation(document, href)?.videoId).toBe(id);
  canonical.remove();
  expect(watchObservation(document, 'https://www.youtube.com/watch?v=ABCDEFGHIJK')).toBeUndefined();
  expect(() =>
    parseObservation({ videoId: id, title: 'test', nebulaURLs: ['https://evil.invalid/'] }),
  ).toThrow();
  expect(() => parseObservation({ videoId: '../url', title: 'test' })).toThrow();
});

test('late responses after navigation never attach the previous video button', async () => {
  page();
  let release!: (value: MatchDecision) => void;
  controller = new WatchController(
    document,
    () => href,
    () =>
      new Promise((r) => {
        release = r;
      }),
  );
  controller.start();
  const oldObservation = watchObservation(document, href) as Observation;
  document.dispatchEvent(new Event('yt-navigate-start'));
  page('ABCDEFGHIJK');
  release(decision(oldObservation));
  await Promise.resolve();
  expect(document.querySelector('#nebulate-video-button')).toBeNull();
});

test('repeated start, sync, navigation and cleanup own one button and observer lifecycle', async () => {
  page();
  let calls = 0;
  controller = new WatchController(
    document,
    () => href,
    async (o) => {
      calls++;
      return decision(o);
    },
  );
  controller.start();
  controller.start();
  await Promise.resolve();
  await Promise.resolve();
  await controller.sync();
  await controller.sync();
  expect(calls).toBe(1);
  expect(document.querySelectorAll('#nebulate-video-button').length).toBe(1);
  expect(document.querySelector<HTMLAnchorElement>('#nebulate-video-button')?.href).toBe(
    'https://nebula.tv/videos/cycling/',
  );
  document.dispatchEvent(new Event('yt-navigate-start'));
  expect(document.querySelector('#nebulate-video-button')).toBeNull();
  page('ABCDEFGHIJK');
  document.dispatchEvent(new Event('yt-navigate-finish'));
  await controller.sync();
  expect(document.querySelectorAll('#nebulate-video-button').length).toBe(1);
  controller.stop();
  expect(document.querySelector('#nebulate-video-button')).toBeNull();
});

test('unmatched and expired-session responses never display a redirect', async () => {
  for (const state of ['no-match', 'retryable-error'] as const) {
    page();
    controller = new WatchController(
      document,
      () => href,
      async (o) => ({ ...decision(o), state, url: undefined }),
    );
    controller.start();
    await Promise.resolve();
    await controller.sync();
    expect(document.querySelector('#nebulate-video-button')).toBeNull();
    controller.stop();
  }
});

test('a failed runtime request retries without navigation and cleanup cancels retries', async () => {
  vi.useFakeTimers();
  page();
  let calls = 0;
  controller = new WatchController(
    document,
    () => href,
    async (o) => {
      if (++calls < 2) throw new Error('worker-interrupted');
      return decision(o);
    },
  );
  controller.start();
  await Promise.resolve();
  expect(document.documentElement.dataset.nebulateState).toBe('retryable-error');
  expect(document.querySelector('#nebulate-video-button')).toBeNull();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(calls).toBe(2);
  expect(document.querySelectorAll('#nebulate-video-button')).toHaveLength(1);
  controller.stop();
  await vi.advanceTimersByTimeAsync(120_000);
  expect(calls).toBe(2);

  let failedCalls = 0;
  controller = new WatchController(
    document,
    () => href,
    async () => {
      failedCalls++;
      throw new Error('worker-interrupted');
    },
  );
  controller.start();
  await Promise.resolve();
  controller.stop();
  await vi.advanceTimersByTimeAsync(120_000);
  expect(failedCalls).toBe(1);
});
