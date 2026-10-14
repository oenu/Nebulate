import type { CreatorMapping, NebulaVideo } from './types';
import { nebulaVideoURL } from './urls';

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('invalid-response');
  return value as Record<string, unknown>;
}

export function text(value: unknown, max = 300): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max)
    throw new Error('invalid-response');
  return value;
}

export function parseCreator(value: unknown, mapping: CreatorMapping): void {
  const data = record(value);
  if (data.type !== 'video_channel' || data.id !== mapping.nebulaId || data.slug !== mapping.slug) {
    throw new Error('creator-identity-changed');
  }
  text(data.title);
}

export function parseVideo(value: unknown): NebulaVideo {
  const data = record(value);
  const slug = text(data.slug, 250);
  const url = nebulaVideoURL(slug);
  const date = typeof data.published_at === 'string' ? Date.parse(data.published_at) : NaN;
  if (
    data.type !== 'video_episode' ||
    !text(data.id).startsWith('video_episode:') ||
    !text(data.channel_id).startsWith('video_channel:') ||
    data.share_url !== url ||
    !Number.isFinite(date) ||
    typeof data.duration !== 'number' ||
    !Number.isFinite(data.duration) ||
    data.duration < 0
  ) {
    throw new Error('invalid-video-response');
  }
  return {
    id: text(data.id),
    slug,
    title: text(data.title, 1000),
    creatorId: text(data.channel_id),
    creatorSlug: text(data.channel_slug),
    publishedAtMs: date,
    durationSeconds: data.duration,
    url,
  };
}

export function catalogueURL(slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100)
    throw new Error('invalid-creator');
  return `https://content.api.nebula.app/video_channels/${slug}/`;
}

export function pageURL(slug: string): string {
  return `${catalogueURL(slug)}video_episodes/?page_size=100`;
}

export function validateCatalogueURL(value: string, slug: string): string {
  const url = new URL(value);
  const base = catalogueURL(slug);
  if (
    url.username ||
    url.password ||
    url.hash ||
    ![base, `${base}video_episodes/`].includes(`${url.origin}${url.pathname}`) ||
    [...url.searchParams].some(
      ([k, v]) =>
        !['offset', 'page_size'].includes(k) ||
        !/^\d{1,6}$/.test(v) ||
        (k === 'page_size' && (Number(v) < 1 || Number(v) > 100)),
    )
  ) {
    throw new Error('invalid-catalogue-destination');
  }
  return url.href;
}

export function parsePage(
  value: unknown,
  slug: string,
): { videos: NebulaVideo[]; next: string | null } {
  const data = record(value);
  if (
    !Array.isArray(data.results) ||
    data.results.length > 100 ||
    (data.next !== null && typeof data.next !== 'string')
  ) {
    throw new Error('invalid-page-response');
  }
  const next = data.next === null ? null : validateCatalogueURL(data.next, slug);
  if (next && new URL(next).pathname !== new URL(pageURL(slug)).pathname)
    throw new Error('invalid-pagination');
  return { videos: data.results.map(parseVideo), next };
}
