// Explicit account-backed acceptance. Output contains only step outcomes/counts.
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { openBrowser } from './browser-driver.mjs';
import { credentialsFromEnv } from './nebula/probe.mjs';

const target = process.argv[2];
if (process.argv[3] !== '--live') throw new Error('This account-backed test requires --live explicitly.');
const expected = 'https://nebula.tv/videos/notjustbikes-cycling-made-difficult-but-its-getting-better/';
let browser; let stage = 'launch';
const counts = { api: 0, publicYouTube: 0, forbidden: 0, misplacedAuthorization: 0, backgroundRequests: 0, unexpectedBackground: 0 };
function audit(url, headerNames = [], backgroundRequest = false) {
  const parsed = new URL(url);
  if (backgroundRequest && /^https?:$/.test(parsed.protocol)) {
    counts.backgroundRequests++;
    if (!['users.api.nebula.app', 'content.api.nebula.app', 'www.youtube.com'].includes(parsed.hostname)) counts.unexpectedBackground++;
  }
  if (/table\.oenu\.org|lookup_table|watchnebula\.com/.test(url)) counts.forbidden++;
  if (parsed.hostname.endsWith('.api.nebula.app')) counts.api++;
  if (parsed.hostname === 'www.youtube.com' && parsed.pathname === '/oembed') {
    counts.publicYouTube++;
    if (headerNames.some(n => ['authorization', 'cookie'].includes(n.toLowerCase()))) counts.misplacedAuthorization++;
  }
}
const report = (step, result = 'ok') => console.log(JSON.stringify({ browser: target, step, result }));
try {
  await rm(`.local/${target}-full-acceptance`, { recursive: true, force: true });
  browser = await openBrowser(target, { profileName: 'full-acceptance' });
  if (target === 'chrome') browser.context.on('request', request => audit(request.url(), Object.keys(request.headers()), Boolean(request.serviceWorker()?.url().startsWith(`${browser.origin}/`))));
  await browser.goto(`${browser.origin}/options.html`);
  if (target === 'firefox') {
    // Firefox BiDi omits extension background-page requests. Keep this options
    // tab alive so the observer's realm survives while the test tab navigates.
    await browser.evaluate(async () => {
      const background = await globalThis.browser.runtime.getBackgroundPage();
      const original = background.fetch.bind(background);
      const counters = background.__nebulateNetworkCounts = { api: 0, publicYouTube: 0, forbidden: 0, misplacedAuthorization: 0, backgroundRequests: 0, unexpectedBackground: 0 };
      background.fetch = (input, options) => {
        const url = new URL(typeof input === 'string' ? input : input.url);
        if (/^https?:$/.test(url.protocol)) {
          counters.backgroundRequests++;
          if (!['users.api.nebula.app', 'content.api.nebula.app', 'www.youtube.com'].includes(url.hostname)) counters.unexpectedBackground++;
        }
        if (/table\.oenu\.org|lookup_table|watchnebula\.com/.test(url.href)) counters.forbidden++;
        if (url.hostname.endsWith('.api.nebula.app')) counters.api++;
        if (url.hostname === 'www.youtube.com' && url.pathname === '/oembed') {
          counters.publicYouTube++;
          const headers = new Headers(options?.headers);
          if (headers.has('authorization') || headers.has('cookie')) counters.misplacedAuthorization++;
        }
        return original(input, options);
      };
    });
    await browser.driver.switchTo().newWindow('tab');
    await browser.goto(`${browser.origin}/options.html`);
  }
  await browser.wait(() => document.querySelector('h2')?.textContent.includes('Local cache'));
  stage = 'runtime-sign-in';
  assert.equal((await browser.message({ type: 'sign-in', ...credentialsFromEnv(await readFile('.env.local', 'utf8')) })).ok, true); report(stage);
  stage = 'public-identity-and-manual-correction';
  const inspected = await browser.message({ type: 'inspect-video', videoId: 'ka8kT_YOtU0' });
  assert.equal(inspected.decision?.state, 'confirmed');
  assert.equal((await browser.message({ type: 'correct-video', videoId: 'ka8kT_YOtU0', nebulaURL: expected })).ok, true);
  assert.equal((await browser.message({ type: 'status' })).overrides, 1);
  await browser.message({ type: 'clear-cache' });
  assert.equal((await browser.message({ type: 'status' })).overrides, 1);
  assert.equal((await browser.message({ type: 'status' })).signedIn, true); report(stage);
  stage = 'watch-button-and-click-through';
  await browser.goto('https://www.youtube.com/watch?v=ka8kT_YOtU0');
  await browser.wait(() => document.querySelectorAll('#nebulate-video-button').length === 1);
  assert.equal(await browser.evaluate(() => document.querySelector('#nebulate-video-button').href), expected);
  stage = 'recommendation-cards';
  await browser.wait(() => document.querySelector('#related yt-lockup-view-model, #related ytd-compact-video-renderer'));
  await browser.evaluate(() => document.querySelector('#related')?.scrollIntoView({ block: 'start' }));
  await browser.wait(() => document.querySelector('#related [data-nebulate-state]:not([data-nebulate-state="checking"])'));
  const recommendations = await browser.evaluate(() => {
    const cards = [...document.querySelectorAll('#related yt-lockup-view-model, #related ytd-compact-video-renderer')];
    return {
      processed: cards.filter(card => card.hasAttribute('data-nebulate-state') && card.getAttribute('data-nebulate-state') !== 'checking').length,
      duplicates: cards.filter(card => card.querySelectorAll('.nebulate-card-link').length > 1).length,
      invalidLinks: [...document.querySelectorAll('#related .nebulate-card-link')].filter(link => !/^https:\/\/nebula\.tv\/videos\/[a-z0-9-]+\/$/.test(link.href)).length,
    };
  });
  assert.ok(recommendations.processed > 0); assert.equal(recommendations.duplicates, 0); assert.equal(recommendations.invalidLinks, 0);
  report(stage);
  stage = 'watch-button-and-click-through';
  await browser.click('#nebulate-video-button');
  await browser.wait(() => location.hostname === 'nebula.tv' && location.pathname.includes('notjustbikes-cycling-made-difficult'));
  report(stage);
  stage = 'search-cards';
  await browser.goto('https://www.youtube.com/results?search_query=notjustbikes+cycling+made+difficult');
  await browser.wait(() => [...document.querySelectorAll('.nebulate-card-link')].some(a => a.href.includes('notjustbikes-cycling-made-difficult')));
  report(stage);
  stage = 'channel-cards';
  await browser.goto('https://www.youtube.com/@NotJustBikes/videos');
  await browser.wait(() => document.querySelector('.nebulate-card-link'));
  assert.equal(await browser.evaluate(() => [...document.querySelectorAll('yt-lockup-view-model')].every(card => card.querySelectorAll('.nebulate-card-link').length <= 1)), true);
  report(stage);
  stage = 'settings-and-local-storage';
  await browser.goto(`${browser.origin}/options.html`);
  const preferences = await browser.message({ type: 'preferences' });
  assert.equal((await browser.message({ type: 'set-preferences', preferences: { ...preferences, preferNewTab: true } })).ok, true);
  assert.equal((await browser.message({ type: 'preferences' })).preferNewTab, true);
  const storage = await browser.evaluate(async () => {
    const api = globalThis.browser ?? chrome;
    return { localAccount: Object.hasOwn(await api.storage.local.get(null), 'account'), syncEntries: Object.keys(await api.storage.sync.get(null)).length };
  });
  assert.equal(storage.localAccount, false); assert.equal(storage.syncEntries, 0); report(stage);
  stage = 'manual-exclusion';
  assert.equal((await browser.message({ type: 'correct-video', videoId: 'ka8kT_YOtU0', nebulaURL: null })).ok, true);
  const excluded = await browser.message({ type: 'inspect-video', videoId: 'ka8kT_YOtU0' });
  assert.equal(excluded.decision.state, 'no-match');
  await browser.message({ type: 'forget-correction', videoId: 'ka8kT_YOtU0' }); report(stage);
  stage = 'logout';
  assert.equal((await browser.message({ type: 'logout' })).ok, true);
  assert.equal((await browser.message({ type: 'status' })).signedIn, false); report(stage);
  stage = 'runtime-network-audit';
  if (target === 'firefox') Object.assign(counts, await browser.evaluate(async () => (await globalThis.browser.runtime.getBackgroundPage()).__nebulateNetworkCounts));
  console.log(JSON.stringify({ browser: target, step: stage, counts }));
  assert.equal(counts.forbidden, 0); assert.equal(counts.misplacedAuthorization, 0); assert.equal(counts.unexpectedBackground, 0); assert.ok(counts.backgroundRequests > 0);
  assert.ok(counts.api > 0); assert.ok(counts.publicYouTube > 0);
  console.log(JSON.stringify({ browser: target, step: stage, result: 'ok', counts }));
} catch { report(stage, 'failed'); process.exitCode = 1; }
finally {
  if (browser) { try { await browser.goto(`${browser.origin}/options.html`); await browser.message({ type: 'logout' }); } catch {} }
  await browser?.close();
}
