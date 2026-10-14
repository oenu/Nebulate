import { type NebulaClient, ServiceError } from './client';
import { matchVideo, resolveCreator } from './matching';
import { parseCreator, parseVideo, record, text } from './metadata';
import type { Pipeline } from './pipeline';
import type { LocalStore } from './storage';
import type { CreatorMapping, ManualOverride } from './types';
import { isNebulaVideoURL } from './urls';
import type { YouTubeMetadata } from './youtube-metadata';

export class Management {
  constructor(
    private readonly store: LocalStore,
    private readonly client: NebulaClient,
    private readonly pipeline: Pipeline,
    private readonly youtube: YouTubeMetadata,
  ) {}

  async status() {
    const all = await this.store.db.getAllFromIndex('decisions', 'checked');
    return {
      state: 'ready',
      signedIn: await this.client.signedIn(),
      matches: all.filter((d) => d.state === 'confirmed').length,
      videos: await this.store.db.count('videos'),
      overrides: await this.store.db.count('overrides'),
      creators: await this.store.db.getAll('creators'),
      jobs: await this.store.db.getAll('jobs'),
      recent: all
        .reverse()
        .slice(0, 20)
        .map((d) => ({ videoId: d.videoId, state: d.state, reason: d.reason })),
    };
  }

  async handle(message: Record<string, unknown>): Promise<unknown> {
    if (message.type === 'status') return this.status();
    if (message.type === 'clear-cache') {
      await this.pipeline.clearCache(message.includeOverrides === true);
      return { ok: true };
    }
    if (message.type === 'refresh') {
      const slug = text(message.slug, 100);
      const mapping = (await this.store.db.getAll('creators')).find((c) => c.slug === slug);
      if (!mapping) throw new ServiceError('creator-unverified');
      return { ok: true, job: await this.pipeline.scheduler.refresh(mapping, true) };
    }
    if (message.type === 'inspect-video') {
      const observation = await this.youtube.observation(text(message.videoId, 11));
      return { observation, decision: await this.pipeline.observe(observation) };
    }
    if (message.type === 'forget-correction') {
      const videoId = text(message.videoId, 11);
      const tx = this.store.db.transaction(['decisions', 'overrides'], 'readwrite');
      await tx.objectStore('decisions').delete(videoId);
      await tx.objectStore('overrides').delete(videoId);
      await tx.done;
      return { ok: true };
    }
    if (message.type === 'correct-video') {
      const observation = await this.youtube.observation(text(message.videoId, 11));
      const mapping = resolveCreator(observation, await this.store.db.getAll('creators'));
      let override: ManualOverride = {
        videoId: observation.videoId,
        observation,
        nebulaId: null,
        updatedAtMs: Date.now(),
      };
      if (message.nebulaURL !== null) {
        if (!isNebulaVideoURL(message.nebulaURL)) throw new ServiceError('invalid-video-url');
        const slug = new URL(message.nebulaURL).pathname.split('/')[2] as string;
        const video = parseVideo(await this.client.episode(slug));
        if (!mapping || video.creatorId !== mapping.nebulaId || video.creatorSlug !== mapping.slug)
          throw new ServiceError('creator-mismatch');
        await this.store.db.put('videos', video);
        override = { ...override, nebulaId: video.id, url: video.url };
      }
      await this.store.correct(
        override,
        matchVideo(observation, mapping, [], Date.now(), override),
      );
      return { ok: true };
    }
    if (message.type === 'map-creator') {
      if (message.confirmed !== true) throw new ServiceError('creator-confirmation-required');
      const channelId = text(message.channelId);
      const handle = text(message.handle);
      const slug = text(message.slug, 100);
      await this.youtube.verifyChannel(channelId, handle);
      const response = record(await this.client.catalogue(slug));
      const mapping: CreatorMapping = {
        youtubeChannelId: channelId,
        youtubeHandle: handle,
        slug,
        nebulaId: text(response.id),
        title: text(response.title),
        source: 'manual',
        confirmedAtMs: Date.now(),
      };
      if (!mapping.nebulaId.startsWith('video_channel:'))
        throw new ServiceError('invalid-creator-response');
      parseCreator(response, mapping);
      const creators = await this.store.db.getAll('creators');
      if (
        creators.some(
          (c) =>
            c.youtubeChannelId !== channelId &&
            c.youtubeHandle?.toLowerCase() === handle.toLowerCase(),
        )
      )
        throw new ServiceError('handle-already-mapped');
      const tx = this.store.db.transaction(['creators', 'decisions'], 'readwrite');
      const previous = await tx.objectStore('creators').get(channelId);
      {
        let cursor = await tx.objectStore('decisions').openCursor();
        while (cursor) {
          if (
            (cursor.value.creatorSlug === previous?.slug ||
              cursor.value.reason === 'creator-unverified') &&
            cursor.value.reason !== 'manual'
          )
            await cursor.delete();
          cursor = await cursor.continue();
        }
      }
      await tx.objectStore('creators').put(mapping);
      await tx.done;
      return { ok: true };
    }
    throw new ServiceError('unsupported-request');
  }
}
