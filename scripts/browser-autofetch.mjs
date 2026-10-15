// Public live acceptance: browsing alone must initiate creator fetches.
import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { openBrowser } from './browser-driver.mjs';

const target = process.argv[2];
if (!['chrome', 'firefox'].includes(target) || process.argv[3] !== '--public') {
  throw new Error('Use chrome|firefox --public explicitly.');
}

const creators = [
  { slug: 'wendover', handle: '@Wendoverproductions' },
  { slug: 'samonella', handle: '@SamONellaAcademy' },
];
let stage = 'launch';
const report = (details) => console.log(JSON.stringify({ target, stage, ...details }));

async function readStatus(browser) {
  // Status is read-only: never call inspect/observe or click Refresh to prewarm
  // the catalogue that the page's own content script is supposed to fetch.
  await browser.goto(`${browser.origin}/options.html`);
  return browser.message({ type: 'status' });
}

async function verifyFirstEncounter(browser, { slug, handle }) {
  stage = `automatic-${slug}`;
  await browser.goto(`https://www.youtube.com/${handle}/videos`);
  await browser.wait(() =>
    document.querySelector(
      'yt-lockup-view-model[data-nebulate-state]:not([data-nebulate-state="checking"])',
    ),
  );
  if (slug === 'wendover') {
    assert.ok(await browser.evaluate(() => document.querySelector('.nebulate-card-link')));
  }
  const status = await readStatus(browser);
  assert.ok(status.jobs.some((job) => job.slug === slug && job.pages > 0));
  report({ result: 'ok', fetchedAutomatically: true });
}

async function ageWendoverCatalogue(browser) {
  // Age only the creator timestamp. Fresh confirmed decisions must still
  // trigger a catalogue refresh when the same creator is encountered again.
  // evaluate runs in the extension page, so its callback must be self-contained.
  return browser.evaluate(async () => {
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('nebulate-local');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('db-unavailable'));
    });
    const confirmedDecisions = await new Promise((resolve, reject) => {
      const transaction = database.transaction(['jobs', 'decisions'], 'readwrite');
      const jobs = transaction.objectStore('jobs');
      const jobRequest = jobs.get('wendover');
      const decisions = [];

      jobRequest.onsuccess = () => {
        jobs.put({ ...jobRequest.result, updatedAtMs: Date.now() - 5 * 60 * 60_000 });
      };
      const decisionsRequest = transaction.objectStore('decisions').getAll();
      decisionsRequest.onsuccess = () => {
        decisions.push(
          ...decisionsRequest.result
            .filter(
              (decision) => decision.creatorSlug === 'wendover' && decision.state === 'confirmed',
            )
            .map((decision) => ({
              videoId: decision.videoId,
              checkedAtMs: decision.checkedAtMs,
            })),
        );
      };
      transaction.oncomplete = () => resolve(decisions);
      transaction.onerror = () => reject(new Error('db-unavailable'));
    });
    database.close();
    return confirmedDecisions;
  });
}

async function waitForCatalogueRefresh(browser, slug) {
  // Poll status from the extension page without ever requesting a refresh.
  await browser.goto(`${browser.origin}/options.html`);
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const status = await browser.message({ type: 'status' });
    const refreshed = status.jobs.some(
      (job) => job.slug === slug && job.status === 'idle' && job.updatedAtMs > Date.now() - 60_000,
    );
    if (refreshed) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

let browser;
try {
  // An empty disposable profile proves neither a previous run nor a saved job
  // supplied the data. This test uses public metadata and no account session.
  await rm(`.local/${target}-autofetch`, { recursive: true, force: true });
  browser = await openBrowser(target, { profileName: 'autofetch' });
  const initialStatus = await readStatus(browser);
  assert.equal(initialStatus.jobs.length, 0);
  assert.equal(initialStatus.videos, 0);
  assert.ok(initialStatus.creators.some((creator) => creator.slug === 'samonella'));

  for (const creator of creators) await verifyFirstEncounter(browser, creator);

  stage = 'cached-encounter-refresh';
  const previousDecisions = await ageWendoverCatalogue(browser);
  assert.ok(previousDecisions.length > 0);
  await browser.goto('https://www.youtube.com/@Wendoverproductions/videos');
  await browser.wait(() => document.querySelector('.nebulate-card-link'));
  assert.equal(await waitForCatalogueRefresh(browser, 'wendover'), true);
  report({ result: 'ok', cachedMatchesTriggeredRefresh: true });
} catch {
  // Keep browser failures scoped to the stage; raw errors may contain page data.
  report({ result: 'failed' });
  process.exitCode = 1;
} finally {
  await browser?.close();
}
