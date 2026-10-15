import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import { REGISTRY_MAPPINGS } from './creators';
import type {
  CreatorMapping,
  ManualOverride,
  MatchDecision,
  NebulaVideo,
  RefreshJob,
} from './types';

interface NebulateDB extends DBSchema {
  creators: { key: string; value: CreatorMapping };
  videos: { key: string; value: NebulaVideo; indexes: { creator: string; published: number } };
  decisions: { key: string; value: MatchDecision; indexes: { checked: number } };
  overrides: { key: string; value: ManualOverride };
  jobs: { key: string; value: RefreshJob };
}

export const SEED: CreatorMapping = {
  youtubeChannelId: 'UC0intLFzLaudFG-xAvUEO-A',
  youtubeHandle: '@notjustbikes',
  nebulaId: 'video_channel:8714203d-6950-4536-be0b-78196a599cf6',
  slug: 'notjustbikes',
  title: 'Not Just Bikes',
  confirmedAtMs: Date.parse('2026-10-14T00:00:00Z'),
  source: 'verified-seed',
};

export const SEEDS: CreatorMapping[] = [
  SEED,
  {
    youtubeChannelId: 'UC9RM-iSvTu1uPJb8X5yp3EQ',
    youtubeHandle: '@Wendoverproductions',
    nebulaId: 'video_channel:fe4d9c1c-017b-494c-9afc-e79e6859b211',
    slug: 'wendover',
    title: 'Wendover',
    confirmedAtMs: Date.parse('2026-10-14T00:00:00Z'),
    source: 'verified-seed',
  },
];

export class LocalStore {
  private constructor(public readonly db: IDBPDatabase<NebulateDB>) {}
  static async open(name = 'nebulate-local'): Promise<LocalStore> {
    const db = await openDB<NebulateDB>(name, 2, {
      upgrade(db, _old, _new, tx) {
        if (!db.objectStoreNames.contains('creators'))
          db.createObjectStore('creators', { keyPath: 'youtubeChannelId' });
        if (!db.objectStoreNames.contains('videos'))
          db.createObjectStore('videos', { keyPath: 'id' });
        const videos = tx.objectStore('videos');
        if (!videos.indexNames.contains('creator')) videos.createIndex('creator', 'creatorId');
        if (!videos.indexNames.contains('published'))
          videos.createIndex('published', 'publishedAtMs');
        if (!db.objectStoreNames.contains('decisions'))
          db.createObjectStore('decisions', { keyPath: 'videoId' });
        const decisions = tx.objectStore('decisions');
        if (!decisions.indexNames.contains('checked'))
          decisions.createIndex('checked', 'checkedAtMs');
        if (!db.objectStoreNames.contains('overrides'))
          db.createObjectStore('overrides', { keyPath: 'videoId' });
        if (!db.objectStoreNames.contains('jobs'))
          db.createObjectStore('jobs', { keyPath: 'slug' });
      },
      blocking() {
        db.close();
      },
    });
    const store = new LocalStore(db);
    const tx = db.transaction(['creators', 'decisions'], 'readwrite');
    let changed = false;
    const affected = new Set<string>();
    const existing = await tx.objectStore('creators').getAll();
    const manual = existing.filter((mapping) => mapping.source === 'manual');
    const conflictsWithManual = (mapping: CreatorMapping) =>
      manual.some(
        (correction) =>
          correction.nebulaId === mapping.nebulaId ||
          (mapping.youtubeHandle &&
            correction.youtubeHandle?.toLowerCase() === mapping.youtubeHandle.toLowerCase()),
      );
    for (const mapping of existing) {
      if (mapping.source !== 'manual' && conflictsWithManual(mapping)) {
        await tx.objectStore('creators').delete(mapping.youtubeChannelId);
        affected.add(mapping.slug);
        changed = true;
      }
    }
    for (const seed of [
      ...SEEDS.filter(
        (seed) =>
          !REGISTRY_MAPPINGS.some((mapping) => seed.youtubeChannelId === mapping.youtubeChannelId),
      ),
      ...REGISTRY_MAPPINGS,
    ]) {
      const previous = await tx.objectStore('creators').get(seed.youtubeChannelId);
      if (previous?.source === 'manual' || conflictsWithManual(seed)) continue;
      // New verified registry data replaces automatic mappings. The original
      // seeds are fallback entries; manual corrections always take priority.
      if (!previous || previous.confirmedAtMs <= seed.confirmedAtMs) {
        await tx.objectStore('creators').put(seed);
        if (
          !previous ||
          previous.slug !== seed.slug ||
          previous.youtubeHandle !== seed.youtubeHandle
        ) {
          changed = true;
          if (previous) affected.add(previous.slug);
        }
      }
    }
    if (changed) {
      let cursor = await tx.objectStore('decisions').openCursor();
      while (cursor) {
        if (
          (cursor.value.state === 'unknown' && cursor.value.reason === 'creator-unverified') ||
          (cursor.value.reason !== 'manual' && affected.has(cursor.value.creatorSlug ?? ''))
        )
          await cursor.delete();
        cursor = await cursor.continue();
      }
    }
    await tx.done;
    return store;
  }

  async saveDecision(decision: MatchDecision): Promise<MatchDecision> {
    const tx = this.db.transaction(['decisions', 'overrides'], 'readwrite');
    const previous = await tx.objectStore('decisions').get(decision.videoId);
    const override = await tx.objectStore('overrides').get(decision.videoId);
    // A refresh started before a correction must never undo it.
    if (override && decision.reason !== 'manual') {
      await tx.done;
      return (
        previous ?? { ...decision, state: 'unknown', url: undefined, reason: 'correction-pending' }
      );
    }
    if (previous && previous.checkedAtMs > decision.checkedAtMs) {
      await tx.done;
      return previous;
    }
    if (
      previous?.state === 'confirmed' &&
      decision.state === 'confirmed' &&
      previous.url !== decision.url &&
      decision.reason !== 'manual'
    ) {
      decision = {
        ...decision,
        state: 'ambiguous',
        url: undefined,
        nebulaId: undefined,
        reason: 'conflicting-previous-match',
      };
    }
    await tx.objectStore('decisions').put(decision);
    await tx.done;
    return decision;
  }

  async correct(override: ManualOverride, decision: MatchDecision): Promise<void> {
    const tx = this.db.transaction(['overrides', 'decisions'], 'readwrite');
    await tx.objectStore('overrides').put(override);
    await tx.objectStore('decisions').put(decision);
    await tx.done;
  }

  async clearCache(includeOverrides = false): Promise<void> {
    const tx = this.db.transaction(['videos', 'decisions', 'jobs', 'overrides'], 'readwrite');
    await tx.objectStore('videos').clear();
    await tx.objectStore('decisions').clear();
    await tx.objectStore('jobs').clear();
    if (includeOverrides) await tx.objectStore('overrides').clear();
    await tx.done;
  }

  async prune(now: number): Promise<void> {
    const tx = this.db.transaction(['decisions', 'videos', 'overrides'], 'readwrite');
    const overrides = await tx.objectStore('overrides').getAll();
    const pinned = new Set(overrides.map((o) => o.nebulaId));
    let cursor = await tx.objectStore('decisions').index('checked').openCursor(null, 'prev');
    let count = 0;
    while (cursor) {
      count++;
      if (
        (count > 2000 || cursor.value.checkedAtMs < now - 90 * 86400000) &&
        cursor.value.reason !== 'manual'
      )
        await cursor.delete();
      cursor = await cursor.continue();
    }
    let video = await tx.objectStore('videos').index('published').openCursor(null, 'prev');
    count = 0;
    while (video) {
      if (++count > 5000 && !pinned.has(video.value.id)) await video.delete();
      video = await video.continue();
    }
    await tx.done;
  }
}
