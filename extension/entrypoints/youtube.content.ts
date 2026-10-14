import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { BrowsingController } from '../core/browsing';
import { migratePreferences } from '../core/preferences';
import { WatchController } from '../core/watch';
import '../core/watch.css';

export default defineContentScript({
  matches: ['https://www.youtube.com/*'],
  main(ctx) {
    const observe = async (observation: import('../core/types').Observation) => {
      const result = await browser.runtime.sendMessage({ type: 'observe', observation });
      if (!result?.state || result.error || !Number.isFinite(result.expiresAtMs))
        throw new Error('observation-unavailable');
      return result;
    };
    const watch = new WatchController(document, () => location.href, observe);
    const browsing = new BrowsingController(document, () => location.href, observe);
    const apply = (value: unknown) => {
      const preferences = migratePreferences(value);
      watch.setPreferences(preferences);
      browsing.setPreferences(preferences);
    };
    void browser.runtime
      .sendMessage({ type: 'preferences' })
      .then(apply)
      .catch(() => {});
    const changed: Parameters<typeof browser.storage.onChanged.addListener>[0] = (
      changes,
      area,
    ) => {
      if (area === 'local' && changes.preferences) apply(changes.preferences.newValue);
    };
    browser.storage.onChanged.addListener(changed);
    const invalidate: Parameters<typeof browser.runtime.onMessage.addListener>[0] = (message) => {
      if (message?.type === 'invalidate') {
        watch.stop();
        browsing.stop();
        watch.start();
        browsing.start();
      }
    };
    browser.runtime.onMessage.addListener(invalidate);
    watch.start();
    browsing.start();
    ctx.onInvalidated(() => {
      watch.stop();
      browsing.stop();
      browser.storage.onChanged.removeListener(changed);
      browser.runtime.onMessage.removeListener(invalidate);
    });
  },
});
