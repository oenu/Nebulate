import { type NebulaClient, ServiceError } from './client';
import { fingerprint, isFresh, matchVideo, resolveCreator } from './matching';
import { RefreshScheduler } from './scheduler';
import type { LocalStore } from './storage';
import type { MatchDecision, Observation } from './types';

export class Pipeline {
  readonly scheduler: RefreshScheduler;
  private revision = 0;
  constructor(
    private readonly store: LocalStore,
    client: NebulaClient,
    private readonly now = Date.now,
  ) {
    this.scheduler = new RefreshScheduler(store, client, now);
  }
  async clearCache(includeOverrides = false): Promise<void> {
    this.revision++;
    await this.store.clearCache(includeOverrides);
  }
  async observe(observation: Observation): Promise<MatchDecision> {
    const revision = this.revision;
    const started = this.now();
    const override = await this.store.db.get('overrides', observation.videoId);
    const mapping = resolveCreator(observation, await this.store.db.getAll('creators'));
    if (override) return matchVideo(observation, mapping, [], started, override);
    const cached = await this.store.db.get('decisions', observation.videoId);
    if (cached && isFresh(cached, observation, started)) return cached;
    if (!mapping) return this.store.saveDecision(matchVideo(observation, undefined, [], started));
    const job = await this.scheduler.refresh(
      mapping,
      Boolean(cached && cached.state !== 'confirmed' && cached.expiresAtMs <= started),
    );
    const videos = await this.store.db.getAllFromIndex('videos', 'creator', mapping.nebulaId);
    let decision = matchVideo(observation, mapping, videos, started);
    if (decision.state !== 'confirmed' && decision.state !== 'ambiguous' && !job.complete) {
      decision = {
        ...decision,
        state:
          job.status === 'refreshing'
            ? 'checking'
            : job.status === 'retry'
              ? 'retryable-error'
              : 'unknown',
        reason:
          job.error ?? (job.status === 'idle' ? 'catalogue-truncated' : 'catalogue-in-progress'),
        expiresAtMs: Math.max(started + 60_000, job.retryAtMs),
      };
    }
    if (job.status === 'retry') {
      if (cached?.state === 'confirmed' && cached.fingerprint === fingerprint(observation))
        return {
          ...cached,
          reason: 'cached-offline',
          expiresAtMs: Math.max(started + 60_000, job.retryAtMs),
        };
      if (decision.state !== 'confirmed')
        decision = {
          ...decision,
          state: 'retryable-error',
          reason: job.error ?? 'metadata-unavailable',
        };
    }
    if (revision !== this.revision || job.error === 'refresh-cancelled')
      throw new ServiceError('refresh-cancelled');
    return this.store.saveDecision(decision);
  }
}
