// Explicit local browser tests only. No account logging, traces or recordings.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium, firefox as pwFirefox } from 'playwright';
import { Builder, By } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { download } from 'geckodriver';

export async function openBrowser(target, { profileName = 'acceptance', preserve = false, headless = true } = {}) {
  if (!['chrome', 'firefox'].includes(target)) throw new Error('invalid-browser');
  const directory = resolve(`.output/${target}-mv3`);
  const profile = resolve(`.local/${target}-${profileName}`);
  await mkdir(profile, { recursive: true });
  if (target === 'chrome') {
    const context = await chromium.launchPersistentContext(profile, { channel: 'chromium', headless,
      args: [`--disable-extensions-except=${directory}`, `--load-extension=${directory}`] });
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    const workerURL = new URL(worker.url());
    const origin = `${workerURL.protocol}//${workerURL.host}`;
    const page = await context.newPage();
    return {
      origin, page, context,
      goto: url => page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }),
      evaluate: (fn, argument) => page.evaluate(fn, argument),
      wait: fn => page.waitForFunction(fn, undefined, { timeout: 45000 }),
      message: message => page.evaluate(message => chrome.runtime.sendMessage(message), message),
      screenshot: path => page.screenshot({ path }),
      click: selector => page.locator(selector).click(),
      close: async () => { await context.close(); if (!preserve) await rm(profile, { recursive: true, force: true }); },
    };
  }
  const uuid = 'e1493254-3f33-4434-ae93-d50bbcc908bc';
  await mkdir('.local/firefox-appdata', { recursive: true });
  const binary = process.env.NEBULATE_FIREFOX_BINARY ?? pwFirefox.executablePath();
  const options = new firefox.Options().enableBidi().setBinary(binary).addArguments(...(headless ? ['-headless'] : []), '-profile', profile)
    .setPreference('extensions.webextensions.uuids', JSON.stringify({ 'firefox-nebulate@oenu.org': uuid }))
    .setPreference('xpinstall.signatures.required', false);
  const driverPath = await download(undefined, resolve('.local/drivers'));
  const driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(driverPath).setEnvironment({ ...process.env, CFFIXED_USER_HOME: resolve('.local/firefox-appdata') })
      .addArguments('--allow-system-access').setStdio('ignore')).build();
  await driver.manage().setTimeouts({ script: 90000, pageLoad: 45000 });
  await driver.installAddon(directory, true);
  return {
    origin: `moz-extension://${uuid}`, driver,
    goto: url => driver.get(url),
    evaluate: (fn, argument) => driver.executeScript(`return (${fn.toString()})(arguments[0]);`, argument),
    wait: fn => driver.wait(() => driver.executeScript(`return (${fn.toString()})();`), 45000),
    message: message => driver.executeAsyncScript('const done=arguments[arguments.length-1];browser.runtime.sendMessage(arguments[0]).then(done,()=>done({error:"browser-message-failed"}));', message),
    screenshot: async path => writeFile(path, await driver.takeScreenshot(), 'base64'),
    click: selector => driver.findElement(By.css(selector)).click(),
    close: async () => { await driver.quit(); if (!preserve) await rm(profile, { recursive: true, force: true }); },
  };
}
