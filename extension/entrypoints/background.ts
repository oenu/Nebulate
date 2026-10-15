import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { NebulaClient, ServiceError, type Session } from '../core/client';
import { Management } from '../core/management';
import { fingerprint } from '../core/matching';
import { isYouTubeSender, parseObservation } from '../core/messages';
import { Pipeline } from '../core/pipeline';
import { migratePreferences } from '../core/preferences';
import { LocalStore } from '../core/storage';
import { YouTubeMetadata } from '../core/youtube-metadata';

export default defineBackground(() => {
  const invalidateTabs = async () => {
    const tabs = await browser.tabs.query({ url: 'https://www.youtube.com/*' });
    await Promise.all(
      tabs.map((tab) =>
        tab.id === undefined
          ? undefined
          : browser.tabs.sendMessage(tab.id, { type: 'invalidate' }).catch(() => {}),
      ),
    );
  };
  const ready = (async () => {
    if (browser.storage.session.setAccessLevel)
      await browser.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    const client = new NebulaClient({
      read: async () =>
        ((await browser.storage.session.get('account')).account as Session | undefined) ?? {
          generation: 'initial',
        },
      write: async (account) => {
        await browser.storage.session.set({ account });
      },
    });
    const old = await browser.storage.local.get(['preferences', 'options']);
    await browser.storage.local.set({
      preferences: migratePreferences(old.preferences, old.options),
    });
    await browser.storage.local.remove(['options', 'table', 'lastUpdate', 'lastUpdated']);
    const store = await LocalStore.open();
    const youtube = new YouTubeMetadata();
    const pipeline = new Pipeline(
      store,
      client,
      Date.now,
      () => void invalidateTabs().catch(() => {}),
    );
    const management = new Management(store, client, pipeline, youtube);
    if (!(await browser.alarms.get('nebulate-recovery')))
      await browser.alarms.create('nebulate-recovery', { periodInMinutes: 1 });
    return { client, store, pipeline, management, youtube };
  })();
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'nebulate-recovery')
      void ready.then(({ pipeline }) => pipeline.scheduler.recover()).catch(() => {});
  });
  browser.runtime.onStartup.addListener(() => {
    void ready.then(({ pipeline }) => pipeline.scheduler.recover()).catch(() => {});
  });
  browser.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== browser.runtime.id || !message || typeof message !== 'object') return;
    const extensionPage = [
      browser.runtime.getURL('/options.html'),
      browser.runtime.getURL('/popup.html'),
    ].includes(sender.url ?? '');
    if (
      !extensionPage &&
      (!isYouTubeSender(sender.url) || !['observe', 'preferences'].includes(message.type))
    )
      return;
    (async () => {
      const { client, pipeline, management, youtube } = await ready;
      if (message.type === 'preferences')
        return migratePreferences((await browser.storage.local.get('preferences')).preferences);
      if (message.type === 'observe') {
        let observation = parseObservation(message.observation);
        if (!observation.channelId && !observation.channelHandle) {
          try {
            observation = await youtube.observation(observation.videoId);
          } catch (error) {
            return {
              videoId: observation.videoId,
              fingerprint: fingerprint(observation),
              state: 'retryable-error',
              reason: error instanceof ServiceError ? error.code : 'metadata-unavailable',
              checkedAtMs: Date.now(),
              expiresAtMs: Date.now() + 60_000,
            };
          }
        }
        return pipeline.observe(observation);
      }
      if (message.type === 'set-preferences') {
        const preferences = migratePreferences(message.preferences);
        await browser.storage.local.set({ preferences });
        return { ok: true };
      }
      if (
        message.type === 'sign-in' &&
        typeof message.email === 'string' &&
        typeof message.password === 'string' &&
        message.email.length <= 320 &&
        message.password.length <= 4096
      ) {
        await client.signIn(message.email, message.password);
        return { ok: true };
      }
      if (message.type === 'logout') return { ok: true, revoked: await client.logout() };
      const result = await management.handle(message);
      if (
        ['clear-cache', 'correct-video', 'forget-correction', 'map-creator', 'refresh'].includes(
          message.type,
        )
      ) {
        await invalidateTabs();
      }
      return result;
    })().then(respond, (error) =>
      respond({ error: error instanceof ServiceError ? error.code : 'request-failed' }),
    );
    return true;
  });
});
