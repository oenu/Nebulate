import { type NebulaClient, ServiceError } from './client';
import { pageURL, parseCreator, parsePage } from './metadata';
import type { LocalStore } from './storage';
import type { CreatorMapping, RefreshJob } from './types';

export const CREATOR_TTL_MS = 4 * 60 * 60_000;
export const LEASE_MS = 45_000;
export const MAX_PAGES = 5;

export class RefreshScheduler {
  private running = new Map<string, Promise<RefreshJob>>();
  private active = 0;
  private waiting: (() => void)[] = [];
  constructor(
    private readonly store: LocalStore,
    private readonly client: NebulaClient,
    private readonly now = Date.now,
    private readonly onUpdated: () => void = () => {},
  ) {}

  async refresh(mapping: CreatorMapping, force = false): Promise<RefreshJob> {
    const previous = this.running.get(mapping.slug);
    if (previous) return previous;
    const run = this.run(mapping, force);
    this.running.set(mapping.slug, run);
    try {
      return await run;
    } finally {
      this.running.delete(mapping.slug);
    }
  }

  private async run(mapping: CreatorMapping, force: boolean): Promise<RefreshJob> {
    if (this.active >= 2) await new Promise<void>((r) => this.waiting.push(r));
    else this.active++;
    try {
      return await this.claimAndRun(mapping, force);
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.active--;
    }
  }

  private async claimAndRun(mapping: CreatorMapping, force: boolean): Promise<RefreshJob> {
    const now = this.now();
    const tx = this.store.db.transaction('jobs', 'readwrite');
    const old = await tx.store.get(mapping.slug);
    if (
      old &&
      ((old.status === 'refreshing' && old.leaseUntilMs > now) ||
        old.retryAtMs > now ||
        (!force && old.status === 'idle' && old.updatedAtMs + CREATOR_TTL_MS > now))
    ) {
      await tx.done;
      return old;
    }
    const resume = old && old.status !== 'idle' && old.nextURL && old.pages < MAX_PAGES;
    let job: RefreshJob = {
      slug: mapping.slug,
      generation: crypto.randomUUID(),
      status: 'refreshing',
      nextURL: resume ? old.nextURL : pageURL(mapping.slug),
      pages: resume ? old.pages : 0,
      startedAtMs: resume ? old.startedAtMs : now,
      updatedAtMs: now,
      leaseUntilMs: now + LEASE_MS,
      retryAtMs: 0,
      complete: false,
      failures: old?.failures ?? 0,
    };
    await tx.store.put(job);
    await tx.done;
    try {
      parseCreator(await this.client.catalogue(mapping.slug), mapping);
      while (job.nextURL && job.pages < MAX_PAGES) {
        const requested = job.nextURL;
        const page = parsePage(await this.client.catalogue(mapping.slug, requested), mapping.slug);
        if (
          page.next &&
          Number(new URL(page.next).searchParams.get('offset') ?? 0) <=
            Number(new URL(requested).searchParams.get('offset') ?? 0)
        ) {
          throw new ServiceError('pagination-cycle');
        }
        const update = this.store.db.transaction(['jobs', 'videos'], 'readwrite');
        const current = await update.objectStore('jobs').get(job.slug);
        if (current?.generation !== job.generation) {
          await update.done;
          throw new ServiceError('refresh-cancelled');
        }
        for (const video of page.videos) await update.objectStore('videos').put(video);
        job = {
          ...job,
          nextURL: page.next,
          pages: job.pages + 1,
          updatedAtMs: this.now(),
          leaseUntilMs: this.now() + LEASE_MS,
        };
        await update.objectStore('jobs').put(job);
        await update.done;
      }
      job = {
        ...job,
        status: 'idle',
        complete: job.nextURL === null,
        leaseUntilMs: 0,
        updatedAtMs: this.now(),
        failures: 0,
        error: undefined,
      };
    } catch (error) {
      const retry = error instanceof ServiceError ? error.retryMs : 60_000;
      const failures = Math.min(10, (job.failures ?? 0) + 1);
      job = {
        ...job,
        status: 'retry',
        error: error instanceof ServiceError ? error.code : 'metadata-unavailable',
        failures,
        leaseUntilMs: 0,
        retryAtMs: this.now() + Math.max(retry, Math.min(86400000, 60_000 * 2 ** (failures - 1))),
      };
    }
    const finish = this.store.db.transaction(['jobs', 'decisions'], 'readwrite');
    if ((await finish.objectStore('jobs').get(job.slug))?.generation === job.generation) {
      await finish.objectStore('jobs').put(job);
      if (job.status === 'idle') {
        let cursor = await finish.objectStore('decisions').openCursor();
        while (cursor) {
          if (
            cursor.value.creatorSlug === mapping.slug &&
            cursor.value.state !== 'confirmed' &&
            cursor.value.reason !== 'manual'
          )
            await cursor.delete();
          cursor = await cursor.continue();
        }
      }
    } else job = { ...job, status: 'retry', error: 'refresh-cancelled' };
    await finish.done;
    if (job.status === 'idle') this.onUpdated();
    return job;
  }

  async recover(): Promise<void> {
    const creators = await this.store.db.getAll('creators');
    const jobs = await this.store.db.getAll('jobs');
    await Promise.all(
      jobs
        .filter(
          (job) =>
            (job.status === 'retry' && job.retryAtMs <= this.now()) ||
            (job.status === 'refreshing' && job.leaseUntilMs <= this.now()),
        )
        .map((job) => {
          const mapping = creators.find((c) => c.slug === job.slug);
          return mapping ? this.refresh(mapping) : undefined;
        }),
    );
    await this.store.prune(this.now());
  }
}
