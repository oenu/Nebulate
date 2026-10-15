// Explicit public-data maintenance. No environment files, account or backend runtime.
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import {
  CREATOR_DIRECTORY,
  type DirectoryCreator,
  parseDirectoryCreator,
} from '../extension/core/creators';
import { normalizedTitle } from '../extension/core/matching';
import { parseChannelVideos, parseYouTubeChannel } from '../extension/core/youtube-channel';
import { youtubeIdentity } from '../extension/core/youtube-metadata';

if (!process.argv.includes('--live'))
  throw new Error('Use --live to update the public creator registry explicitly.');

const VERIFICATION_TTL_MS = 24 * 60 * 60_000;
const REQUEST_INTERVAL_MS = 1_100;
const DEFAULT_BACKOFF_MS = 5 * 60_000;

type Candidate = {
  slug: string;
  title: string;
  nebulaId: string;
  youtubeChannelId: string;
  parentSlug?: string;
};
type Channel = {
  channelId: string;
  handle: string;
  title: string;
  videos: { id: string; title: string }[];
  checkedAtMs?: number;
};
const candidates: Candidate[] = JSON.parse(
  await readFile('scripts/data/creator-candidates.json', 'utf8'),
);
const cachePath = '.local/creator-verification-cache.json';
await mkdir('.local', { recursive: true });
// Cache successes and unavailable channels so interrupted maintenance can
// resume without repeating the same public requests throughout the day.
let cache: Record<string, { atMs: number; channel?: Channel }> = {};
try {
  cache = JSON.parse(await readFile(cachePath, 'utf8'));
} catch {}
let rateLimited = false;
const retryPath = '.local/creator-registry-retry.json';
let retryAtMs = 0;
try {
  retryAtMs = JSON.parse(await readFile(retryPath, 'utf8')).retryAtMs ?? 0;
} catch {}
if (retryAtMs > Date.now())
  throw new Error(`Public verification is in backoff until ${new Date(retryAtMs).toISOString()}.`);

let lastRequestMs = 0;
async function fetchPublicMetadata(url: string) {
  const target = new URL(url);
  if (
    target.protocol !== 'https:' ||
    !['www.youtube.com', 'content.api.nebula.app'].includes(target.hostname) ||
    target.username ||
    target.password ||
    target.port
  )
    throw new Error('destination-denied');
  if (rateLimited) throw new Error('rate-limited');
  const delay = REQUEST_INTERVAL_MS - (Date.now() - lastRequestMs);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  lastRequestMs = Date.now();
  const response = await fetch(target, {
    redirect: 'error',
    credentials: 'omit',
    signal: AbortSignal.timeout(15000),
  });
  if (response.status === 429) {
    // Persist the deadline so restarting this script cannot bypass a server's
    // Retry-After. Stop further requests for the rest of this invocation too.
    rateLimited = true;
    const header = response.headers.get('retry-after');
    const retryMs =
      header && /^\d+$/.test(header)
        ? Number(header) * 1000
        : header
          ? Date.parse(header) - Date.now()
          : DEFAULT_BACKOFF_MS;
    retryAtMs =
      Date.now() + Math.max(60_000, Number.isFinite(retryMs) ? retryMs : DEFAULT_BACKOFF_MS);
    await writeFile(retryPath, JSON.stringify({ retryAtMs }));
    throw new Error('rate-limited');
  }
  if (!response.ok) throw new Error('public-metadata-unavailable');
  return response;
}

const normalizedBrand = (value: string) =>
  normalizedTitle(value)
    .replace(/\b(?:official|productions|academy|videos|channel)\b/g, '')
    .replace(/\s/g, '');

async function loadChannel(reference: string, needVideos = false): Promise<Channel | undefined> {
  const cached =
    cache[reference] ??
    Object.values(cache).find(
      (proof) =>
        proof.channel?.channelId === reference ||
        proof.channel?.handle.toLowerCase() === reference.toLowerCase(),
    );
  if (
    cached &&
    cached.atMs + VERIFICATION_TTL_MS > Date.now() &&
    (!cached.channel || !needVideos || cached.channel.videos.length > 0)
  )
    return cached.channel ? { ...cached.channel, checkedAtMs: cached.atMs } : undefined;
  try {
    const path = /^UC[\w-]{22}$/.test(reference)
      ? `/channel/${reference}`
      : /^@[\p{L}\p{N}_.-]{1,100}$/u.test(reference)
        ? `/${reference}`
        : undefined;
    if (!path) throw new Error('invalid-channel-reference');
    const html = await (await fetchPublicMetadata(`https://www.youtube.com${path}/videos`)).text();
    const metadata = parseYouTubeChannel(html);
    if (path.startsWith('/channel/') && metadata.channelId !== reference)
      throw new Error('channel-id-changed');
    const videos = parseChannelVideos(html);
    const result = { ...metadata, videos, checkedAtMs: Date.now() };
    cache[reference] = { atMs: Date.now(), channel: result };
    return result;
  } catch {
    if (rateLimited) throw new Error('rate-limited');
    cache[reference] = { atMs: Date.now() };
    return;
  }
}

const entries: DirectoryCreator[] = [];
const websites = new Map<string, string>();
let next: string | null = 'https://content.api.nebula.app/video_channels/?page_size=100';
const seen = new Set<string>();
while (next) {
  const url = new URL(next);
  if (
    url.origin !== 'https://content.api.nebula.app' ||
    url.pathname !== '/video_channels/' ||
    seen.has(next) ||
    seen.size >= 100 ||
    [...url.searchParams].some(
      ([key, value]) => !['offset', 'page_size'].includes(key) || !/^\d{1,6}$/.test(value),
    )
  )
    throw new Error('invalid-directory-pagination');
  seen.add(next);
  const page = await (await fetchPublicMetadata(next)).json();
  if (
    !Array.isArray(page.results) ||
    page.results.length > 100 ||
    !(page.next === null || typeof page.next === 'string')
  )
    throw new Error('invalid-directory');
  for (const value of page.results) {
    const entry = parseDirectoryCreator({ ...value, kind: value.channel_type });
    entries.push(entry);
    if (typeof value.website === 'string') websites.set(entry.slug, value.website);
  }
  next = page.next;
}
if (new Set(entries.map((entry) => entry.id)).size !== entries.length)
  throw new Error('duplicate-directory-id');
console.log(JSON.stringify({ step: 'directory', creators: entries.length, pages: seen.size }));
// Verify curated historical IDs first, then try discovery for remaining channels.
entries.sort(
  (a, b) =>
    Number(candidates.some((c) => c.nebulaId === b.id && !c.parentSlug)) -
      Number(candidates.some((c) => c.nebulaId === a.id && !c.parentSlug)) ||
    a.slug.localeCompare(b.slug),
);
let cursor = 0;
async function verifyMappings() {
  while (cursor < entries.length && !rateLimited) {
    const entry = entries[cursor++];
    if (entry?.kind !== 'default') continue;
    const historical = candidates.find(
      (candidate) =>
        candidate.nebulaId === entry.id && candidate.slug === entry.slug && !candidate.parentSlug,
    );
    let result: Channel | undefined;
    let verifiedBy: string | undefined;
    // A historical row is only a candidate: require unchanged Nebula identity
    // and a matching current YouTube owner name before activating its mapping.
    if (historical) {
      result = await loadChannel(historical.youtubeChannelId);
      if (
        result &&
        (normalizedBrand(result.title) === normalizedBrand(entry.title) ||
          normalizedBrand(result.title) === normalizedBrand(historical.title))
      )
        verifiedBy = 'historical-stable-ids-and-current-channel-identity';
    }
    // A YouTube channel linked by Nebula itself is stronger evidence than a
    // guessed handle. Resolve the linked page to its canonical channel ID.
    if (!verifiedBy) {
      const website = websites.get(entry.slug);
      if (website)
        try {
          const url = new URL(website);
          if (url.protocol === 'https:' && url.hostname === 'www.youtube.com') {
            const reference =
              /^\/channel\/(UC[\w-]{22})\/?$/.exec(url.pathname)?.[1] ??
              /^\/(@[^/]+)\/?$/.exec(url.pathname)?.[1];
            if (reference) {
              result = await loadChannel(reference);
              if (result) verifiedBy = 'first-party-nebula-website';
            }
          }
        } catch {}
    }
    // A guessed same-name handle alone proves nothing. Require two distinct,
    // sufficiently long shared video titles and verify both YouTube authors.
    if (!verifiedBy) {
      result = await loadChannel(`@${entry.slug}`, true);
      if (result && normalizedBrand(result.title) === normalizedBrand(entry.title)) {
        const page = await (
          await fetchPublicMetadata(
            `https://content.api.nebula.app/video_channels/${entry.slug}/video_episodes/?page_size=100`,
          )
        ).json();
        const titles = new Set(
          (page.results as { channel_id: string; title: string }[])
            .filter((video) => video.channel_id === entry.id)
            .map((video) => normalizedTitle(video.title)),
        );
        // Repeated uploads with the same title count as one piece of evidence.
        const matchingTitles = new Map<string, { id: string; title: string }>();
        for (const video of result.videos) {
          const title = normalizedTitle(video.title);
          if (title.length >= 12 && titles.has(title)) matchingTitles.set(title, video);
        }
        const matches = [...matchingTitles.values()];
        if (matches.length >= 2) {
          let authorsMatch = true;
          for (const video of matches.slice(0, 2)) {
            const watchURL = `https://www.youtube.com/watch?v=${video.id}`;
            const data = await (
              await fetchPublicMetadata(
                `https://www.youtube.com/oembed?url=${encodeURIComponent(watchURL)}&format=json`,
              )
            ).json();
            const author = youtubeIdentity(data.author_url);
            if (
              author.channelId !== result.channelId &&
              author.channelHandle?.toLowerCase() !== result.handle.toLowerCase()
            )
              authorsMatch = false;
          }
          if (authorsMatch) verifiedBy = 'current-channel-identity-and-two-public-video-titles';
        }
      }
    }
    if (result && verifiedBy)
      entry.youtube = {
        channelId: result.channelId,
        handle: result.handle,
        verifiedBy,
        verifiedAtMs: result.checkedAtMs ?? Date.now(),
      };
    if (cursor % 25 === 0)
      console.log(
        JSON.stringify({
          step: 'verify',
          processed: cursor,
          total: entries.length,
          mapped: entries.filter((entry) => entry.youtube).length,
        }),
      );
    await writeFile(cachePath, JSON.stringify(cache));
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
}
try {
  await verifyMappings();
} catch {
  console.log(
    JSON.stringify({
      step: 'verify',
      result: rateLimited ? 'rate-limited' : 'public-verification-failed',
    }),
  );
  process.exitCode = 1;
}
// Preserve already verified mappings only for unchanged stable Nebula identities.
for (const entry of entries) {
  const old = CREATOR_DIRECTORY.find((old) => old.id === entry.id && old.slug === entry.slug);
  if (!entry.youtube && old?.youtube) entry.youtube = old.youtube;
}
// Do not let two Nebula entries claim one YouTube identity. Leave both
// unresolved instead of choosing a winner based on directory traversal order.
const channelCounts = new Map<string, number>();
for (const entry of entries)
  if (entry.youtube)
    channelCounts.set(
      entry.youtube.channelId,
      (channelCounts.get(entry.youtube.channelId) ?? 0) + 1,
    );
for (const entry of entries)
  if (entry.youtube && channelCounts.get(entry.youtube.channelId) !== 1) delete entry.youtube;
entries.sort((a, b) => a.slug.localeCompare(b.slug));
// Publish atomically; interrupted writes must leave the bundled registry intact.
await writeFile(
  '.local/creator-registry-next.json',
  `${JSON.stringify({ schemaVersion: 1, updatedAtMs: Date.now(), entries }, null, 2)}\n`,
);
await rename('.local/creator-registry-next.json', 'extension/core/creators.json');
console.log(
  JSON.stringify({
    step: 'complete',
    creators: entries.length,
    mapped: entries.filter((entry) => entry.youtube).length,
    unmapped: entries.filter((entry) => !entry.youtube).length,
  }),
);
if (rateLimited)
  console.log(JSON.stringify({ step: 'paused', retryAfter: new Date(retryAtMs).toISOString() }));
