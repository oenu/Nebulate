import { ServiceError } from './client';
import { record, text } from './metadata';
import type { Observation } from './types';

export function youtubeIdentity(value: string): Pick<Observation, 'channelId' | 'channelHandle'> {
  const url = new URL(value, 'https://www.youtube.com');
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'www.youtube.com' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new ServiceError('invalid-youtube-identity');
  const channelId = /^\/channel\/(UC[\w-]{22})\/?$/.exec(url.pathname)?.[1];
  const channelHandle = /^\/(@[\p{L}\p{N}_.-]{1,100})\/?$/u.exec(
    decodeURIComponent(url.pathname),
  )?.[1];
  if (!channelId && !channelHandle) throw new ServiceError('invalid-youtube-identity');
  return { channelId, channelHandle };
}

export class YouTubeMetadata {
  private cache = new Map<string, { atMs: number; value: Promise<Observation> }>();
  private active = 0;
  private waiting: (() => void)[] = [];
  constructor(private readonly fetcher: typeof fetch = (...args) => globalThis.fetch(...args)) {}

  async observation(videoId: string): Promise<Observation> {
    if (!/^[\w-]{11}$/.test(videoId)) throw new ServiceError('invalid-video-id');
    const cached = this.cache.get(videoId);
    if (cached && cached.atMs + 4 * 3600000 > Date.now()) return cached.value;
    const value = this.load(videoId);
    this.cache.set(videoId, { atMs: Date.now(), value });
    if (this.cache.size > 500) this.cache.delete(this.cache.keys().next().value as string);
    try {
      return await value;
    } catch (error) {
      this.cache.delete(videoId);
      throw error;
    }
  }

  private async get(url: string): Promise<Response> {
    let response: Response;
    try {
      response = await this.fetcher(url, {
        redirect: 'error',
        credentials: 'omit',
        signal: AbortSignal.timeout(10000),
      });
    } catch {
      throw new ServiceError('youtube-metadata-unavailable');
    }
    if (!response.ok || response.redirected)
      throw new ServiceError(
        response.status === 429 ? 'rate-limited' : 'youtube-metadata-unavailable',
        response.status,
      );
    return response;
  }

  private async load(videoId: string): Promise<Observation> {
    if (this.active >= 2) await new Promise<void>((r) => this.waiting.push(r));
    else this.active++;
    try {
      const response = await this.get(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      );
      let data: Record<string, unknown>;
      try {
        data = record(await response.json());
      } catch {
        throw new ServiceError('youtube-metadata-unavailable');
      }
      return { videoId, title: text(data.title, 1000), ...youtubeIdentity(text(data.author_url)) };
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.active--;
    }
  }

  async verifyChannel(channelId: string, handle: string): Promise<void> {
    if (!/^UC[\w-]{22}$/.test(channelId)) throw new ServiceError('invalid-channel-id');
    youtubeIdentity(`https://www.youtube.com/${handle}`);
    const response = await this.get(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    );
    const xml = await response.text();
    const returned = xml.match(/<yt:channelId>([\w-]+)<\/yt:channelId>/)?.[1];
    const videoId = xml.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    if (
      !returned ||
      ![returned, `UC${returned}`].includes(channelId) ||
      !videoId ||
      (await this.observation(videoId)).channelHandle?.toLowerCase() !== handle.toLowerCase()
    )
      throw new ServiceError('channel-verification-failed');
  }
}
