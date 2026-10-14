import { catalogue, probeSession, safeError } from './api.mjs';
const api = globalThis.browser ?? chrome;
const ready = (async () => {
  if (api.storage.session.setAccessLevel) await api.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  await api.storage.session.set({ probeMarker: 'privileged-only' });
})();
api.runtime.onInstalled.addListener(() => api.tabs.create({ url: api.runtime.getURL('probe.html') }));
api.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id || sender.url !== api.runtime.getURL('probe.html')) return;
  (async () => {
    await ready;
    if (message?.type === 'public') {
      const data = await catalogue();
      return { result: 'ok', pages: data.pages, videos: data.videos.length, hasMore: data.hasMore };
    }
    if (message?.type === 'live' && typeof message.email === 'string' && typeof message.password === 'string') {
      const steps = [];
      await probeSession({ email: message.email, password: message.password, report: r => steps.push(r) });
      return { result: 'ok', steps, sessionStorage: (await api.storage.session.get('probeMarker')).probeMarker === 'privileged-only' };
    }
    return { result: 'denied' };
  })().then(respond, error => respond({ result: 'failed', ...safeError(error) }));
  return true;
});
