import { fingerprint } from './matching';
import { DEFAULT_PREFERENCES } from './preferences';
import type { MatchDecision, Observation, Preferences } from './types';
import { isNebulaVideoURL } from './urls';
import { rocketLink } from './watch';
import { youtubeIdentity } from './youtube-metadata';

export interface VideoCard {
  element: Element;
  observation: Observation;
}

export function videoCards(document: Document, href: string): VideoCard[] {
  const page = new URL(href);
  let pageCreator: Pick<Observation, 'channelId' | 'channelHandle'> = {};
  if (/^\/(?:@[^/]+|channel\/UC[\w-]{22})\/videos\/?$/.test(page.pathname)) {
    try {
      pageCreator = youtubeIdentity(
        `https://www.youtube.com${page.pathname.replace(/\/videos\/?$/, '')}`,
      );
    } catch {}
  }
  const results: VideoCard[] = [];
  for (const element of document.querySelectorAll(
    'yt-lockup-view-model, ytd-video-renderer, ytd-grid-video-renderer, ytd-compact-video-renderer, ytd-rich-grid-media',
  )) {
    const titleLink = element.querySelector<HTMLAnchorElement>(
      'h3 a[href*="/watch"], a#video-title[href*="/watch"]',
    );
    if (!titleLink) continue;
    const url = new URL(titleLink.getAttribute('href') ?? '', page.origin);
    const videoId =
      url.hostname === 'www.youtube.com' && url.pathname === '/watch'
        ? url.searchParams.get('v')
        : null;
    const title = titleLink.getAttribute('title')?.trim() || titleLink.textContent?.trim();
    if (!videoId || !/^[\w-]{11}$/.test(videoId) || !title || title.length > 1000) continue;
    const creator = element.querySelector<HTMLAnchorElement>(
      '#channel-name a[href], a[href^="/@"], a[href^="/channel/"]',
    );
    let identity = pageCreator;
    if (creator) {
      try {
        identity = youtubeIdentity(creator.getAttribute('href') ?? '');
      } catch {
        continue;
      }
    }
    results.push({ element, observation: { videoId, title, ...identity } });
  }
  return results;
}

export class BrowsingController {
  private observer?: MutationObserver;
  private timer?: ReturnType<typeof setTimeout>;
  private entries = new Map<
    Element,
    { key: string; decision?: MatchDecision; retryAtMs: number }
  >();
  private preferences = DEFAULT_PREFERENCES;
  private revision = 0;
  private navigating = false;
  private active = 0;
  constructor(
    private readonly document: Document,
    private readonly href: () => string,
    private readonly observe: (observation: Observation) => Promise<MatchDecision>,
    private readonly visible = (element: Element): boolean => {
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.bottom >= -200 &&
        rect.top <= (document.defaultView?.innerHeight ?? 1000) + 300
      );
    },
  ) {}

  setPreferences(value: Preferences): void {
    this.preferences = value;
    for (const [element, entry] of this.entries) this.render(element, entry.decision);
    this.schedule();
  }
  private clear(element: Element): void {
    element.removeAttribute('data-nebulate-state');
    element.querySelectorAll('.nebulate-card-link').forEach((link) => {
      link.remove();
    });
    element.classList.remove('nebulate-card-confirmed');
  }
  private render(element: Element, decision?: MatchDecision): void {
    this.clear(element);
    if (decision) element.setAttribute('data-nebulate-state', decision.state);
    if (
      !this.preferences.thumbnails ||
      decision?.state !== 'confirmed' ||
      !isNebulaVideoURL(decision.url)
    )
      return;
    element.classList.add('nebulate-card-confirmed');
    const link = rocketLink(this.document, decision.url, this.preferences);
    link.classList.add('nebulate-card-link');
    element.append(link);
  }
  async sync(): Promise<void> {
    if (!this.observer || this.navigating || !this.preferences.thumbnails) return;
    for (const element of this.entries.keys())
      if (!element.isConnected) this.entries.delete(element);
    const revision = this.revision;
    for (const { element, observation } of videoCards(this.document, this.href())) {
      if (!this.visible(element)) continue;
      const key = `${observation.videoId}:${fingerprint(observation)}`;
      const current = this.entries.get(element);
      if (current?.key === key && current.retryAtMs > Date.now()) {
        if (
          current.decision?.state === 'confirmed' &&
          !element.querySelector('.nebulate-card-link')
        )
          this.render(element, current.decision);
        continue;
      }
      if (this.active >= 4) break;
      this.clear(element);
      element.setAttribute('data-nebulate-state', 'checking');
      const entry = {
        key,
        retryAtMs: Number.MAX_SAFE_INTEGER,
        decision: undefined as MatchDecision | undefined,
      };
      this.entries.set(element, entry);
      this.active++;
      void this.observe(observation)
        .then(
          (decision) => {
            if (
              !this.observer ||
              revision !== this.revision ||
              this.entries.get(element) !== entry ||
              !element.isConnected
            )
              return;
            const fresh = videoCards(this.document, this.href()).find(
              (card) => card.element === element,
            );
            if (!fresh || `${fresh.observation.videoId}:${fingerprint(fresh.observation)}` !== key)
              return;
            entry.decision = decision;
            entry.retryAtMs = Math.max(Date.now() + 60_000, decision.expiresAtMs);
            this.render(element, decision);
          },
          () => {
            entry.retryAtMs = Date.now() + 60_000;
          },
        )
        .finally(() => {
          this.active--;
          if (this.observer) this.schedule();
        });
    }
  }
  private schedule = (): void => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.sync(), 150);
  };
  private startNavigation = (): void => {
    this.navigating = true;
    this.revision++;
    for (const element of this.entries.keys()) this.clear(element);
    this.entries.clear();
  };
  private finishNavigation = (): void => {
    this.navigating = false;
    this.schedule();
  };
  start(): void {
    if (this.observer) return;
    this.navigating = false;
    this.observer = new MutationObserver(this.schedule);
    this.observer.observe(this.document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['href', 'title'],
    });
    this.document.addEventListener('yt-navigate-start', this.startNavigation);
    this.document.addEventListener('yt-navigate-finish', this.finishNavigation);
    this.document.defaultView?.addEventListener('scroll', this.schedule, { passive: true });
    void this.sync();
  }
  stop(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    this.revision++;
    clearTimeout(this.timer);
    this.document.removeEventListener('yt-navigate-start', this.startNavigation);
    this.document.removeEventListener('yt-navigate-finish', this.finishNavigation);
    this.document.defaultView?.removeEventListener('scroll', this.schedule);
    for (const element of this.entries.keys()) this.clear(element);
    this.entries.clear();
  }
}
