import type { Observation } from './types';
import { isNebulaVideoURL } from './urls';

export function watchObservation(document: Document, href: string): Observation | undefined {
  const url = new URL(href);
  const videoId = url.pathname === '/watch' ? url.searchParams.get('v') : null;
  if (!videoId || !/^[\w-]{11}$/.test(videoId)) return;
  const watch = document.querySelector('ytd-watch-flexy');
  if (watch?.getAttribute('video-id') && watch.getAttribute('video-id') !== videoId) return;
  const canonical = document.querySelector<HTMLLinkElement>('link[rel=canonical]');
  if (canonical) {
    const resource = new URL(canonical.href);
    const canonicalId = resource.pathname.startsWith('/shorts/')
      ? resource.pathname.split('/')[2]
      : resource.searchParams.get('v');
    if (canonicalId !== videoId) return;
  }
  const title = document.querySelector('ytd-watch-metadata h1, #title h1')?.textContent?.trim();
  const creator = document.querySelector<HTMLAnchorElement>(
    '#owner a[href^="/@"], #owner a[href^="/channel/"]',
  );
  const creatorURL = creator ? new URL(creator.getAttribute('href') ?? '', url.origin) : undefined;
  const channelId =
    document.querySelector<HTMLMetaElement>('meta[itemprop="channelId"]')?.content ||
    (creatorURL?.pathname.startsWith('/channel/') ? creatorURL.pathname.split('/')[2] : undefined);
  const channelHandle = creatorURL?.pathname.startsWith('/@')
    ? creatorURL.pathname.split('/')[1]
    : undefined;
  if (!title || (!channelId && !channelHandle)) return;
  const published = document.querySelector<HTMLMetaElement>(
    'meta[itemprop="datePublished"]',
  )?.content;
  const publishedAtMs = published ? Date.parse(published) : undefined;
  // Descriptions may be collapsed or contain redirect links; use only direct,
  // canonical Nebula URLs. Never follow page-provided arbitrary destinations.
  const nebulaURLs = [...document.querySelectorAll<HTMLAnchorElement>('#description a[href]')]
    .map((a) => a.getAttribute('href'))
    .filter(isNebulaVideoURL)
    .slice(0, 10);
  return {
    videoId,
    title,
    channelId,
    channelHandle,
    nebulaURLs,
    publishedAtMs:
      publishedAtMs !== undefined && Number.isFinite(publishedAtMs) ? publishedAtMs : undefined,
  };
}
