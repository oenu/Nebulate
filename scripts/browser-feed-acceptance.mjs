// Interactive Google sign-in stays entirely in the disposable browser UI.
// Never export cookies, profile contents, account details or private feed data.
import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { openBrowser } from './browser-driver.mjs';
import { credentialsFromEnv } from './nebula/probe.mjs';

const target = process.argv[2];
if (process.argv[3] !== '--live' || process.argv[4] !== '--interactive') throw new Error('Use chrome|firefox --live --interactive explicitly.');
let browser; let stage = 'launch'; let complete = false;
const profileName = 'signed-in-feed';
const report = (step, details = {}) => console.log(JSON.stringify({ browser: target, step, ...details }));
const counts = () => {
  const cards = [...document.querySelectorAll('yt-lockup-view-model,ytd-video-renderer,ytd-rich-grid-media')];
  return { cards: cards.length, processed: cards.filter(c => c.hasAttribute('data-nebulate-state') && c.getAttribute('data-nebulate-state') !== 'checking').length,
    links: document.querySelectorAll('.nebulate-card-link').length,
    duplicates: cards.filter(c => c.querySelectorAll('.nebulate-card-link').length > 1).length,
    invalidLinks: [...document.querySelectorAll('.nebulate-card-link')].filter(a => !/^https:\/\/nebula\.tv\/videos\/[a-z0-9-]+\/$/.test(a.href)).length };
};
try {
  browser = await openBrowser(target, { profileName, preserve: true, headless: false });
  await browser.goto('https://www.youtube.com/feed/subscriptions');
  stage = 'waiting-for-user-youtube-sign-in'; report(stage);
  const deadline = Date.now() + 30 * 60_000;
  let available = false;
  while (Date.now() < deadline) {
    try { available = (await browser.evaluate(counts)).cards > 0; } catch {}
    if (available) break;
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  if (!available) throw new Error('interactive-sign-in-timeout');
  report('youtube-subscription-feed-available');
  await browser.goto(`${browser.origin}/options.html`);
  assert.equal((await browser.message({ type: 'sign-in', ...credentialsFromEnv(await readFile('.env.local', 'utf8')) })).ok, true);
  stage = 'signed-in-subscriptions';
  await browser.goto('https://www.youtube.com/feed/subscriptions');
  await browser.wait(() => [...document.querySelectorAll('[data-nebulate-state]')].some(c => c !== document.documentElement && c.getAttribute('data-nebulate-state') !== 'checking'));
  let result = await browser.evaluate(counts);
  assert.ok(result.cards > 0); assert.ok(result.processed > 0); assert.equal(result.duplicates, 0); assert.equal(result.invalidLinks, 0); report(stage, result);
  stage = 'signed-in-home';
  await browser.goto('https://www.youtube.com/');
  await browser.wait(() => document.querySelector('ytd-rich-grid-renderer'));
  result = await browser.evaluate(counts);
  if (result.cards > 0) {
    await browser.wait(() => [...document.querySelectorAll('[data-nebulate-state]')].some(c => c !== document.documentElement && c.getAttribute('data-nebulate-state') !== 'checking'));
    result = await browser.evaluate(counts);
  }
  assert.equal(result.duplicates, 0); assert.equal(result.invalidLinks, 0); report(stage, { ...result, emptyFeed: result.cards === 0 });
  stage = 'recommendations';
  await browser.goto('https://www.youtube.com/watch?v=ka8kT_YOtU0');
  await browser.wait(() => document.querySelector('#nebulate-video-button'));
  await browser.wait(() => document.querySelector('#related [data-nebulate-state]:not([data-nebulate-state="checking"])'));
  result = await browser.evaluate(counts);
  assert.ok(result.processed > 0); assert.equal(result.duplicates, 0); assert.equal(result.invalidLinks, 0); report(stage, result);
  complete = true;
} catch { report(stage, { result: 'failed' }); process.exitCode = 1; }
finally {
  if (browser) { try { await browser.goto(`${browser.origin}/options.html`); await browser.message({ type: 'logout' }); } catch {} }
  await browser?.close();
  if (complete) await rm(`.local/${target}-${profileName}`, { recursive: true, force: true });
}
