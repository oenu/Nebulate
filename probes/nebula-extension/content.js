(async () => {
  const api = globalThis.browser ?? chrome;
  let readable = false;
  try { readable = (await api.storage.session.get('probeMarker')).probeMarker !== undefined; } catch {}
  document.documentElement.dataset.nebulateProbeSessionReadable = String(readable);
})();
