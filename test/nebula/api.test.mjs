import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { LOGIN, AUTHORIZE, CONTENT, ProbeError, validateDestination, request, retryAfterSeconds, sanitizeCreator, sanitizePage, catalogue, probeSession, safeError } from '../../scripts/nebula/api.mjs';
import { credentialsFromEnv } from '../../scripts/nebula/probe.mjs';

const fixture = JSON.parse(await readFile(new URL('./fixtures/notjustbikes.json', import.meta.url)));
const creator = fixture.creator;
const rawVideo = v => ({ type: 'video_episode', id: v.id, slug: v.slug, title: v.title, channel_id: v.channelId, channel_slug: v.channelSlug, published_at: v.publishedAt, duration: v.durationSeconds, share_url: v.url });
const rawPage = { next: null, previous: null, results: fixture.videos.map(rawVideo) };
const json = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

test('environment file is parsed as data and never evaluated', () => {
  assert.deepEqual(credentialsFromEnv('uname="example@example.invalid"\npass="$(touch /tmp/never-run)"'), { email: 'example@example.invalid', password: '$(touch /tmp/never-run)' });
  assert.throws(() => credentialsFromEnv('NEBULA_USERNAME='), /missing-credentials/);
});

test('destinations reject other hosts, credentials, paths, queries and redirect tricks', () => {
  for (const value of ['http://content.api.nebula.app/video_channels/notjustbikes/', 'https://content.api.nebula.app.evil.invalid/', `${CONTENT}/video_channels/another/`, `${CONTENT}/video_channels/notjustbikes/?token=private`, `${LOGIN}?next=https://evil.invalid`, 'https://user:pass@content.api.nebula.app/video_channels/notjustbikes/', `${CONTENT}/video_channels/notjustbikes/#x`]) {
    assert.throws(() => validateDestination(value, 'notjustbikes'), ProbeError);
  }
  assert.equal(validateDestination(`${CONTENT}/video_channels/notjustbikes/video_episodes/?offset=2&page_size=2`, 'notjustbikes'), `${CONTENT}/video_channels/notjustbikes/video_episodes/?offset=2&page_size=2`);
});

test('credentials and authorization cannot be sent to a catalogue or redirect destination', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return json({}); };
  await assert.rejects(request(`${CONTENT}/video_channels/notjustbikes/`, { method: 'POST', body: { password: 'fixture' }, fetcher }), /credential-destination-denied/);
  await assert.rejects(request(LOGIN, { token: 'fixture', fetcher }), /token-destination-denied/);
  assert.equal(calls, 0);
  await assert.rejects(request(LOGIN, { method: 'POST', body: {}, fetcher: async (_, options) => {
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    return new Response('', { status: 302, headers: { Location: 'https://evil.invalid' } });
  } }), /redirect-denied/);
});

test('errors and retry guidance are sanitized', async () => {
  await assert.rejects(request(LOGIN, { fetcher: async () => { throw new Error('private-value'); } }), error => JSON.stringify(safeError(error)) === '{"code":"network-or-redirect","status":null,"retryAfterSeconds":null}');
  await assert.rejects(request(LOGIN, { fetcher: async () => new Response('private response', { status: 429, headers: { 'retry-after': '90' } }) }), error => error.code === 'rate-limited' && error.retryAfterSeconds === 90);
  assert.equal(retryAfterSeconds('Wed, 14 Oct 2026 12:00:10 GMT', Date.parse('2026-10-14T12:00:00Z')), 10);
  assert.equal(retryAfterSeconds('invalid'), null);
  assert.equal(safeError(new Error('private')).code, 'unexpected-error');
});

test('metadata validates identity, excludes private fields and flags cross-promotions', () => {
  assert.deepEqual(sanitizeCreator({ type: 'video_channel', ...creator, private: 'discard' }, creator.slug), creator);
  const page = sanitizePage(rawPage, creator);
  assert.equal(page.videos.filter(v => v.primaryCreatorMatches).length, 2);
  assert.throws(() => sanitizePage({ ...rawPage, next: 'https://evil.invalid' }, creator), /invalid-destination/);
  assert.throws(() => sanitizePage({ ...rawPage, results: [{ ...rawPage.results[0], share_url: 'https://evil.invalid' }] }, creator), /invalid-video-response/);
});

test('pagination is bounded and cycles fail without scraping the full catalogue', async () => {
  let calls = 0;
  const fetcher = async url => { calls++; return json(url.endsWith('/notjustbikes/') ? { type: 'video_channel', ...creator } : { ...rawPage, next: `${CONTENT}/video_channels/notjustbikes/video_episodes/?offset=2&page_size=2` }); };
  assert.equal((await catalogue({ maxPages: 1, fetcher })).hasMore, true);
  assert.equal(calls, 2);
  await assert.rejects(catalogue({ maxPages: 3, fetcher }), /pagination-cycle/);
});

test('session probe logs only step results and revokes the login in finally', async () => {
  const reports = []; let loggedOut = false;
  const fetcher = async (url, options) => {
    if (url === LOGIN) return json({ key: 'fixture-key' });
    if (url === AUTHORIZE) return loggedOut ? new Response('', { status: 401 }) : json({ token: 'fixture-token' });
    if (url.includes('logout')) { loggedOut = true; return json({ detail: 'ok' }); }
    if (options.headers.Authorization === 'Bearer nebulate-invalid-probe-token') return new Response('', { status: 401 });
    if (url.includes('nonexistent')) return new Response('', { status: 404 });
    return json(url.endsWith('/notjustbikes/') ? { type: 'video_channel', ...creator } : rawPage);
  };
  await probeSession({ email: 'fixture@example.invalid', password: 'fixture-password', fetcher, report: r => reports.push(r) });
  assert.equal(loggedOut, true);
  assert.equal(reports.at(-1).result, 'revoked');
  assert.doesNotMatch(JSON.stringify(reports), /fixture-key|fixture-token|fixture-password/);
});
