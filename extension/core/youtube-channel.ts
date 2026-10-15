import { record, text } from './metadata';

// Read one JSON object from first-party HTML as data; never execute site scripts.
export function jsonObjectAfter(source: string, marker: string): Record<string, unknown> {
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('channel-metadata-unavailable');
  const offset = start + marker.length;
  let quoted = false;
  let escaped = false;
  let depth = 0;
  // Braces inside titles are data, not JSON boundaries. Track strings and
  // escapes rather than trying to capture a nested object with a regex.
  for (let index = offset; index < source.length; index++) {
    const character = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === '"') quoted = false;
    } else if (character === '"') quoted = true;
    else if (character === '{') depth++;
    else if (character === '}' && --depth === 0)
      return record(JSON.parse(source.slice(offset, index + 1)));
  }
  throw new Error('channel-metadata-unavailable');
}

export function parseYouTubeChannel(source: string) {
  if (source.length > 5_000_000) throw new Error('channel-response-too-large');
  // Other channel IDs in this HTML may belong to recommendations. Only the
  // page owner's metadata establishes which channel this response represents.
  const data = jsonObjectAfter(source, '"channelMetadataRenderer":');
  const channelId = text(data.externalId);
  if (!/^UC[\w-]{22}$/.test(channelId)) throw new Error('invalid-channel-id');
  const url = new URL(text(data.vanityChannelUrl));
  const handle = decodeURIComponent(url.pathname).replace(/\/$/, '').slice(1);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.hostname !== 'www.youtube.com' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^@[\p{L}\p{N}_.-]{1,100}$/u.test(handle)
  )
    throw new Error('invalid-youtube-identity');
  return { channelId, handle, title: text(data.title, 1000) };
}

export function parseChannelVideos(source: string): { id: string; title: string }[] {
  const videos = new Map<string, { id: string; title: string }>();
  for (const match of source.matchAll(/"(videoRenderer|gridVideoRenderer|lockupViewModel)":/g)) {
    const data = jsonObjectAfter(source.slice(match.index), match[0]);
    let id: unknown;
    let title: unknown;
    if (match[1] === 'lockupViewModel') {
      if (data.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO') continue;
      id = data.contentId;
      const metadata = record(data.metadata);
      const lockup = record(metadata.lockupMetadataViewModel);
      title = record(lockup.title).content;
    } else {
      id = data.videoId;
      const value = record(data.title);
      title =
        value.simpleText ??
        (Array.isArray(value.runs)
          ? value.runs.map((run) => text(record(run).text, 1000)).join('')
          : undefined);
    }
    if (
      typeof id === 'string' &&
      /^[\w-]{11}$/.test(id) &&
      typeof title === 'string' &&
      title.length <= 1000
    )
      videos.set(id, { id, title });
  }
  return [...videos.values()].slice(0, 100);
}
