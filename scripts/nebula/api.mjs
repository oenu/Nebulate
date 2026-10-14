// Shared by the disposable extension and the local development probe.
// No environment files, account responses, or tokens are bundled or logged.
export const LOGIN = 'https://users.api.nebula.app/api/v1/auth/login/';
export const LOGOUT = 'https://users.api.nebula.app/api/v1/auth/logout/';
export const AUTHORIZE = 'https://users.api.nebula.app/api/v1/authorization/';
export const CONTENT = 'https://content.api.nebula.app';

export class ProbeError extends Error {
  constructor(code, status = null, retryAfterSeconds = null) {
    super(code);
    this.name = 'ProbeError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function creatorURL(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
    throw new ProbeError('invalid-creator');
  }
  return `${CONTENT}/video_channels/${slug}/`;
}

export function episodesURL(slug) {
  return `${creatorURL(slug)}video_episodes/?page_size=2`;
}

export function validateDestination(value, slug) {
  let url;
  try { url = new URL(value); } catch { throw new ProbeError('invalid-destination'); }
  if (url.username || url.password || url.hash) throw new ProbeError('invalid-destination');
  if ([LOGIN, LOGOUT, AUTHORIZE].includes(url.href)) return url.href;
  const base = new URL(creatorURL(slug));
  const allowedPath = [base.pathname, `${base.pathname}video_episodes/`].includes(url.pathname);
  const allowedQuery = [...url.searchParams].every(([key, val]) =>
    ['offset', 'page_size'].includes(key) && /^\d{1,6}$/.test(val) &&
    (key !== 'page_size' || (Number(val) > 0 && Number(val) <= 100)));
  if (url.origin !== CONTENT || !allowedPath || !allowedQuery) throw new ProbeError('invalid-destination');
  return url.href;
}

export function retryAfterSeconds(value, now = Date.now()) {
  if (!value) return null;
  const seconds = /^\d+$/.test(value) ? Number(value) : (Date.parse(value) - now) / 1000;
  return Number.isFinite(seconds) ? Math.min(86400, Math.max(0, Math.ceil(seconds))) : null;
}

// Suppress raw fetch/parse errors: they can contain request or response secrets.
export async function request(url, { slug = 'notjustbikes', method = 'GET', body, key, token, fetcher = fetch } = {}) {
  const destination = validateDestination(url, slug);
  const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
  if (body !== undefined && destination !== LOGIN) throw new ProbeError('credential-destination-denied');
  if ((key && ![AUTHORIZE, LOGOUT].includes(destination)) || (token && !destination.startsWith(`${CONTENT}/`)) || (key && token)) {
    throw new ProbeError('token-destination-denied');
  }
  if ((body !== undefined || key) && method !== 'POST') throw new ProbeError('invalid-method');
  if (destination.startsWith(`${CONTENT}/`) && method !== 'GET') throw new ProbeError('invalid-method');
  if (key) headers.Authorization = `Token ${key}`;
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetcher(destination, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'error', credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(20000),
    });
  } catch { throw new ProbeError('network-or-redirect'); }
  if (response.redirected || response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)) {
    throw new ProbeError('redirect-denied', response.status);
  }
  if (!response.ok) {
    const code = ({ 401: 'sign-in-required', 403: 'forbidden', 404: 'unavailable', 429: 'rate-limited' })[response.status] ?? 'http-error';
    throw new ProbeError(code, response.status, retryAfterSeconds(response.headers.get('retry-after')));
  }
  try { return await response.json(); } catch { throw new ProbeError('invalid-json', response.status); }
}

export function sanitizeCreator(value, slug) {
  const expected = creatorURL(slug);
  if (!value || value.type !== 'video_channel' || value.slug !== slug ||
      typeof value.id !== 'string' || !value.id.startsWith('video_channel:') ||
      typeof value.title !== 'string' || !value.title.trim()) throw new ProbeError('invalid-creator-response');
  return { id: value.id, slug, title: value.title, source: expected };
}

export function sanitizePage(value, creator) {
  if (!value || !Array.isArray(value.results) || !('next' in value) || !('previous' in value)) {
    throw new ProbeError('invalid-page-response');
  }
  const next = value.next === null ? null : validateDestination(value.next, creator.slug);
  if (next && new URL(next).pathname !== new URL(episodesURL(creator.slug)).pathname) throw new ProbeError('invalid-next-page');
  const videos = value.results.map(video => {
    if (!video || video.type !== 'video_episode' || typeof video.id !== 'string' ||
        !video.id.startsWith('video_episode:') || typeof video.slug !== 'string' ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(video.slug) || typeof video.title !== 'string' || !video.title.trim() ||
        typeof video.channel_id !== 'string' || typeof video.channel_slug !== 'string' ||
        typeof video.published_at !== 'string' || !Number.isFinite(Date.parse(video.published_at)) ||
        !Number.isFinite(video.duration) || video.duration < 0 ||
        video.share_url !== `https://nebula.tv/videos/${video.slug}/`) throw new ProbeError('invalid-video-response');
    return {
      id: video.id, slug: video.slug, title: video.title,
      channelId: video.channel_id, channelSlug: video.channel_slug,
      publishedAt: video.published_at, durationSeconds: video.duration, url: video.share_url,
      // Creator feeds can include cross-promotions from other primary channels.
      primaryCreatorMatches: video.channel_id === creator.id && video.channel_slug === creator.slug,
    };
  });
  return { next, videos };
}

export function safeError(error) {
  return error instanceof ProbeError
    ? { code: error.code, status: error.status, retryAfterSeconds: error.retryAfterSeconds }
    : { code: 'unexpected-error', status: null, retryAfterSeconds: null };
}

export async function catalogue({ slug = 'notjustbikes', token, maxPages = 2, fetcher = fetch } = {}) {
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 5) throw new ProbeError('invalid-page-limit');
  const creator = sanitizeCreator(await request(creatorURL(slug), { slug, token, fetcher }), slug);
  let next = episodesURL(slug);
  const visited = new Set();
  const videos = [];
  while (next && visited.size < maxPages) {
    if (visited.has(next)) throw new ProbeError('pagination-cycle');
    visited.add(next);
    const page = sanitizePage(await request(next, { slug, token, fetcher }), creator);
    videos.push(...page.videos);
    next = page.next;
  }
  return { creator, videos, pages: visited.size, hasMore: next !== null };
}

function secretField(value, field) {
  if (!value || typeof value[field] !== 'string' || !value[field].length || /[\r\n]/.test(value[field])) {
    throw new ProbeError('invalid-auth-response');
  }
  return value[field];
}

export async function signIn(email, password, fetcher = fetch) {
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) throw new ProbeError('missing-credentials');
  return secretField(await request(LOGIN, { method: 'POST', body: { email, password }, fetcher }), 'key');
}

export async function authorize(key, fetcher = fetch) {
  return secretField(await request(AUTHORIZE, { method: 'POST', key, fetcher }), 'token');
}

export async function logout(key, fetcher = fetch) {
  await request(LOGOUT, { method: 'POST', key, fetcher });
}

export async function probeSession({ email, password, slug = 'notjustbikes', fetcher = fetch, report = () => {} }) {
  let key;
  try {
    key = await signIn(email, password, fetcher);
    report({ step: 'login', result: 'ok' });
    let token = await authorize(key, fetcher);
    report({ step: 'authorization', result: 'ok' });
    const data = await catalogue({ slug, token, fetcher });
    report({ step: 'catalogue', result: 'ok', pages: data.pages, videos: data.videos.length,
      primaryCreatorVideos: data.videos.filter(v => v.primaryCreatorMatches).length, hasMore: data.hasMore });
    token = await authorize(key, fetcher);
    await catalogue({ slug, token, maxPages: 1, fetcher });
    report({ step: 'token-reissue', result: 'ok', actualExpiryWaited: false });
    // Exercise the server's rejected-bearer path without waiting for natural
    // expiry or storing an account token on disk. This is explicitly simulated.
    try {
      await request(creatorURL(slug), { slug, token: 'nebulate-invalid-probe-token', fetcher });
      report({ step: 'rejected-bearer', result: 'public-endpoint-ignores-invalid-bearer', actualExpiryWaited: false });
    } catch (error) {
      if (!(error instanceof ProbeError) || ![401, 403].includes(error.status)) throw error;
      token = await authorize(key, fetcher);
      await catalogue({ slug, token, maxPages: 1, fetcher });
      report({ step: 'rejected-bearer-recovery', result: 'ok', status: error.status, actualExpiryWaited: false });
    }
    try {
      await request(creatorURL('nebulate-nonexistent-creator-probe'), { slug: 'nebulate-nonexistent-creator-probe', token, fetcher });
      report({ step: 'unavailable-creator', result: 'unexpected-success' });
    } catch (error) {
      if (!(error instanceof ProbeError) || error.status !== 404) throw error;
      report({ step: 'unavailable-creator', result: 'unavailable', status: 404 });
    }
    return data;
  } finally {
    if (key) {
      await logout(key, fetcher);
      report({ step: 'logout', result: 'ok' });
      try {
        await authorize(key, fetcher);
        report({ step: 'revocation', result: 'key-still-accepted' });
      } catch (error) {
        if (!(error instanceof ProbeError) || error.status !== 401) throw error;
        report({ step: 'revocation', result: 'revoked', status: 401 });
      }
    }
  }
}
