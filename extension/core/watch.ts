import { fingerprint } from './matching';
import { DEFAULT_PREFERENCES } from './preferences';
import type { MatchDecision, Observation, Preferences } from './types';
import { isNebulaVideoURL } from './urls';
import { watchObservation } from './youtube';

export function rocketLink(
  document: Document,
  url: string,
  preferences: Preferences,
): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = url;
  link.className = 'nebulate-rocket';
  link.title = 'Watch on Nebula';
  link.setAttribute('aria-label', 'Watch on Nebula');
  link.style.color = preferences.buttonColor;
  link.rel = 'noopener noreferrer';
  if (preferences.preferNewTab) link.target = '_blank';
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  for (const [name, value] of Object.entries({
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  }))
    svg.setAttribute(name, value);
  for (const d of [
    'M4 13a8 8 0 0 1 7 7a6 6 0 0 0 3 -5a9 9 0 0 0 6 -8a3 3 0 0 0 -3 -3a9 9 0 0 0 -8 6a6 6 0 0 0 -5 3',
    'M7 14a6 6 0 0 0 -3 6a6 6 0 0 0 6 -3',
  ]) {
    const path = document.createElementNS(namespace, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  const circle = document.createElementNS(namespace, 'circle');
  circle.setAttribute('cx', '15');
  circle.setAttribute('cy', '9');
  circle.setAttribute('r', '1');
  svg.append(circle);
  link.append(svg);
  link.addEventListener('click', (event) => event.stopPropagation());
  return link;
}

export class WatchController {
  private observer?: MutationObserver;
  private timer?: ReturnType<typeof setTimeout>;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private revision = 0;
  private key = '';
  private navigating = false;
  private last?: MatchDecision;
  private preferences = DEFAULT_PREFERENCES;
  constructor(
    private readonly document: Document,
    private readonly href: () => string,
    private readonly observe: (value: Observation) => Promise<MatchDecision>,
  ) {}

  setPreferences(value: Preferences): void {
    this.preferences = value;
    this.render();
  }
  private clear(): void {
    this.document.querySelectorAll('#nebulate-video-button').forEach((e) => {
      e.remove();
    });
    this.document.querySelectorAll('.nebulate-confirmed-player').forEach((e) => {
      e.classList.remove('nebulate-confirmed-player');
    });
  }
  private render(): void {
    this.clear();
    if (this.last?.state !== 'confirmed' || !isNebulaVideoURL(this.last.url)) return;
    const current = watchObservation(this.document, this.href());
    if (!current || current.videoId !== this.last.videoId || this.navigating) return;
    const controls = this.document.querySelector('.ytp-right-controls');
    if (controls && this.preferences.showVideoButton) {
      const link = rocketLink(this.document, this.last.url, this.preferences);
      link.id = 'nebulate-video-button';
      controls.prepend(link);
    }
    if (this.preferences.highlightVideo)
      this.document
        .querySelector('#player, #movie_player')
        ?.classList.add('nebulate-confirmed-player');
  }
  async sync(): Promise<void> {
    if (this.navigating) return;
    const observation = watchObservation(this.document, this.href());
    const key = observation ? `${observation.videoId}:${fingerprint(observation)}` : '';
    if (!observation) {
      this.key = '';
      this.last = undefined;
      this.revision++;
      this.clear();
      return;
    }
    if (key === this.key && (!this.last || this.last.expiresAtMs > Date.now())) {
      if (
        this.last?.state === 'confirmed' &&
        !this.document.querySelector('#nebulate-video-button')
      )
        this.render();
      return;
    }
    this.key = key;
    this.last = undefined;
    this.clear();
    this.document.documentElement.dataset.nebulateState = 'checking';
    const revision = ++this.revision;
    try {
      const decision = await this.observe(observation);
      if (revision !== this.revision || !this.observer) return;
      this.last = decision;
      this.document.documentElement.dataset.nebulateState = decision.state;
      this.render();
      clearTimeout(this.retryTimer);
      if (
        decision.reason !== 'manual' &&
        (decision.state !== 'confirmed' || decision.reason === 'cached-offline')
      ) {
        this.retryTimer = setTimeout(
          () => void this.sync(),
          Math.min(3600000, Math.max(60_000, decision.expiresAtMs - Date.now())),
        );
      }
    } catch {
      if (revision !== this.revision || !this.observer) return;
      this.key = '';
      this.document.documentElement.dataset.nebulateState = 'retryable-error';
      clearTimeout(this.retryTimer);
      this.retryTimer = setTimeout(() => void this.sync(), 60_000);
    }
  }
  private schedule = (): void => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.sync(), 100);
  };
  private startNavigation = (): void => {
    this.navigating = true;
    this.revision++;
    this.key = '';
    this.last = undefined;
    this.clear();
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
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['video-id', 'href'],
    });
    this.document.addEventListener('yt-navigate-start', this.startNavigation);
    this.document.addEventListener('yt-navigate-finish', this.finishNavigation);
    this.document.defaultView?.addEventListener('popstate', this.finishNavigation);
    void this.sync();
  }
  stop(): void {
    this.observer?.disconnect();
    this.observer = undefined;
    clearTimeout(this.timer);
    clearTimeout(this.retryTimer);
    this.revision++;
    this.key = '';
    this.document.removeEventListener('yt-navigate-start', this.startNavigation);
    this.document.removeEventListener('yt-navigate-finish', this.finishNavigation);
    this.document.defaultView?.removeEventListener('popstate', this.finishNavigation);
    this.clear();
  }
}
