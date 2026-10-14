import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { credentialsFromEnv } from './nebula/probe.mjs';
import { openBrowser } from './browser-driver.mjs';

const target = process.argv[2];
if (!['--live', '--public'].includes(process.argv[3])) throw new Error('Choose --public or --live explicitly.');
const live = process.argv[3] === '--live';
const observation = { videoId: 'ka8kT_YOtU0', title: "Cycling Made Difficult (but it's getting better!)", channelId: 'UC0intLFzLaudFG-xAvUEO-A' };
const expected = 'https://nebula.tv/videos/notjustbikes-cycling-made-difficult-but-its-getting-better/';
let browser;
let stage = 'launch';
try {
  // Start each build's acceptance with a fresh disposable profile. Chrome can
  // restore an unpacked extension's old worker script across ordinary restarts.
  await rm(`.local/${target}-watch`, { recursive: true, force: true });
  browser = await openBrowser(target, { profileName: 'watch', preserve: true });
  browser.context?.on('requestfailed', request => {
    if (!['users.api.nebula.app', 'content.api.nebula.app'].includes(new URL(request.url()).hostname)) return;
    const reason = request.failure()?.errorText;
    console.log(JSON.stringify({ browser: target, step: 'network-failure', host: new URL(request.url()).hostname,
      code: /^net::[A-Z_]+$/.test(reason ?? '') ? reason : 'request-failed' }));
  });
  await browser.goto(`${browser.origin}/options.html`);
  await browser.wait(() => document.querySelector('h1')?.textContent.includes('Nebulate'));
  if (live) {
    stage = 'runtime-sign-in';
    const credentials = credentialsFromEnv(await readFile('.env.local', 'utf8'));
    const login = await browser.message({ type: 'sign-in', ...credentials });
    if (!login?.ok) console.log(JSON.stringify({ browser: target, step: stage, code: typeof login?.error === 'string' ? login.error : 'no-response' }));
    assert.equal(login?.ok, true);
    assert.equal((await browser.message({ type: 'status' })).signedIn, true);
    console.log(JSON.stringify({ browser: target, step: stage, result: 'ok' }));
    stage = 'rejected-bearer';
    await browser.evaluate(async () => { const api = globalThis.browser ?? chrome; const { account } = await api.storage.session.get('account'); await api.storage.session.set({ account: { ...account, token: 'nebulate-invalid-acceptance-token' } }); });
  }
  stage = 'real-match';
  const decision = await browser.message({ type: 'observe', observation });
  assert.equal(decision.state, 'confirmed'); assert.equal(decision.url, expected);
  console.log(JSON.stringify({ browser: target, step: stage, state: decision.state, recoveredBearer: live }));
  stage = 'watch-page-button';
  await browser.goto('https://www.youtube.com/watch?v=ka8kT_YOtU0');
  await browser.wait(() => document.querySelectorAll('#nebulate-video-button').length === 1);
  assert.equal(await browser.evaluate(() => document.querySelector('#nebulate-video-button').href), expected);
  console.log(JSON.stringify({ browser: target, step: stage, result: 'ok' }));
  stage = 'real-unmatched-promotion';
  await browser.goto('https://www.youtube.com/watch?v=02eltxATsn4');
  await browser.wait(() => ['no-match', 'ambiguous', 'unknown'].includes(document.documentElement.dataset.nebulateState));
  assert.equal(await browser.evaluate(() => document.querySelectorAll('#nebulate-video-button').length), 0);
  console.log(JSON.stringify({ browser: target, step: stage, result: 'no-false-button' }));
  await browser.goto(`${browser.origin}/options.html`);
  if (live) {
    stage = 'logout';
    assert.equal((await browser.message({ type: 'logout' })).ok, true);
    assert.equal((await browser.message({ type: 'status' })).signedIn, false);
    console.log(JSON.stringify({ browser: target, step: stage, result: 'ok' }));
  }
  const persisted = await browser.message({ type: 'observe', observation });
  await browser.close(); browser = undefined;
  stage = 'browser-restart';
  browser = await openBrowser(target, { profileName: 'watch', preserve: false });
  await browser.goto(`${browser.origin}/options.html`);
  const cached = await browser.message({ type: 'observe', observation });
  assert.equal(cached.state, 'confirmed'); assert.equal(cached.checkedAtMs, persisted.checkedAtMs);
  assert.equal((await browser.message({ type: 'status' })).signedIn, false);
  console.log(JSON.stringify({ browser: target, step: stage, persistedMatch: true, accountSessionCleared: true }));
} catch { console.log(JSON.stringify({ browser: target, step: stage, result: 'failed' })); process.exitCode = 1; }
finally {
  if (live && browser) {
    try { await browser.goto(`${browser.origin}/options.html`); await browser.message({ type: 'logout' }); } catch {}
  }
  await browser?.close();
}
