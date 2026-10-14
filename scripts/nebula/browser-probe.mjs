// Disposable Phase 2 runner. Uses the root development dependencies after the toolchain migration.
// No traces, screenshots, request logs, profiles, or account payloads are exported.
import { readFile, rm, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { credentialsFromEnv } from './probe.mjs';
import { ProbeError, safeError } from './api.mjs';

const target = process.argv[2];
if (!['chrome', 'firefox'].includes(target) || !['--public', '--live'].includes(process.argv[3])) {
  console.log('Usage: PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/nebula/browser-probe.mjs chrome|firefox --public|--live');
  process.exit(1);
}
const live = process.argv[3] === '--live';
const directory = resolve(`probes/nebula-extension/${target}`);
const { chromium, firefox: pwFirefox } = await import('playwright');
const credentials = live ? credentialsFromEnv(await readFile('.env.local', 'utf8')) : null;
let cleanup = async () => {};
let stage = 'launch';
try {
  if (target === 'chrome') {
    const profile = resolve('.local/chrome-probe-profile');
    const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless: true,
      args: [`--disable-extensions-except=${directory}`, `--load-extension=${directory}`] });
    cleanup = async () => { await context.close(); await rm(profile, { recursive: true, force: true }); };
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const url = await worker.evaluate(() => chrome.runtime.getURL('probe.html'));
    const page = await context.newPage();
    await page.goto(url);
    stage = 'extension-request';
    if (live) {
      await page.locator('[name=email]').fill(credentials.email);
      await page.locator('[name=password]').fill(credentials.password);
      await page.locator('[type=submit]').click();
    } else await page.locator('#public').click();
    await page.waitForFunction(() => document.querySelector('#result').textContent.startsWith('{'), { timeout: 90000 });
    const result = JSON.parse(await page.locator('#result').textContent());
    console.log(JSON.stringify({ browser: target, mode: live ? 'live' : 'public', ...result }));
    if (result.result !== 'ok') throw new ProbeError('extension-probe-failed');
    stage = 'content-storage-access';
    await page.goto('https://www.youtube.com/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => 'nebulateProbeSessionReadable' in document.documentElement.dataset);
    const readable = await page.evaluate(() => document.documentElement.dataset.nebulateProbeSessionReadable);
    console.log(JSON.stringify({ browser: target, step: stage, readable }));
    if (readable !== 'false') throw new ProbeError('session-exposed');
  } else {
    const { Builder, By, until } = await import('selenium-webdriver');
    const { default: firefox } = await import('selenium-webdriver/firefox.js');
    const { download } = await import('geckodriver');
    const driverPath = await download(undefined, resolve('.local/drivers'));
    const uuid = 'e1493254-3f33-4434-ae93-d50bbcc908bb';
    const options = new firefox.Options().setBinary(pwFirefox.executablePath()).addArguments('-headless')
      .setPreference('extensions.webextensions.uuids', JSON.stringify({ 'nebulate-probe@local.invalid': uuid }));
    await mkdir('.local/firefox-profiles', { recursive: true });
    // Isolate macOS app-data bookkeeping too; -profile alone still touches the
    // protected real Firefox directory (Mozilla bug 2060476).
    await mkdir('.local/firefox-appdata', { recursive: true });
    const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
      .setFirefoxService(new firefox.ServiceBuilder(driverPath)
        .setEnvironment({ ...process.env, CFFIXED_USER_HOME: resolve('.local/firefox-appdata') })
        .addArguments('--allow-system-access', '--profile-root', resolve('.local/firefox-profiles')).setStdio('ignore')).build();
    cleanup = () => driver.quit();
    await driver.manage().setTimeouts({ script: 90000, pageLoad: 45000, implicit: 0 });
    await driver.installAddon(directory, true);
    await driver.get(`moz-extension://${uuid}/probe.html`);
    stage = 'extension-request';
    if (live) {
      await driver.executeScript('document.querySelector("[name=email]").value=arguments[0];document.querySelector("[name=password]").value=arguments[1];', credentials.email, credentials.password);
      await driver.findElement(By.css('[type=submit]')).click();
    } else await driver.findElement(By.id('public')).click();
    const resultElement = await driver.findElement(By.id('result'));
    await driver.wait(async () => (await resultElement.getText()).startsWith('{'), 90000);
    const result = JSON.parse(await resultElement.getText());
    console.log(JSON.stringify({ browser: target, mode: live ? 'live' : 'public', ...result }));
    if (result.result !== 'ok') throw new ProbeError('extension-probe-failed');
    stage = 'content-storage-access';
    await driver.get('https://www.youtube.com/');
    await driver.wait(async () => await driver.executeScript('return "nebulateProbeSessionReadable" in document.documentElement.dataset'), 30000);
    const readable = await driver.executeScript('return document.documentElement.dataset.nebulateProbeSessionReadable');
    console.log(JSON.stringify({ browser: target, step: stage, readable }));
    if (readable !== 'false') throw new ProbeError('session-exposed');
  }
} catch (error) {
  console.log(JSON.stringify({ browser: target, stage, result: 'failed', ...safeError(error) }));
  if (!live && stage === 'launch') console.log(JSON.stringify({ credentialFreeStartup: true, kind: error.name, reason: String(error.message).split('\n')[0] }));
  process.exitCode = 1;
} finally { await cleanup().catch(() => {}); }
