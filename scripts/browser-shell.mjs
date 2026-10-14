import assert from 'node:assert/strict';
import { openBrowser } from './browser-driver.mjs';
const target = process.argv[2];
let browser;
try {
  browser = await openBrowser(target, { profileName: 'shell' });
  for (const page of ['options.html', 'popup.html']) {
    await browser.goto(`${browser.origin}/${page}`);
    await browser.wait(() => document.querySelector('h1')?.textContent.includes('Nebulate'));
    const result = await browser.message({ type: 'status' });
    assert.equal(result.state, 'ready');
    console.log(JSON.stringify({ browser: target, page, rendered: true, background: result.state }));
  }
} catch { console.log(JSON.stringify({ browser: target, result: 'shell-failed' })); process.exitCode = 1; }
finally { await browser?.close(); }
