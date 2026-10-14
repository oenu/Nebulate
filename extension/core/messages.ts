import type { Observation } from './types';
import { isNebulaVideoURL } from './urls';

export function parseObservation(value: unknown): Observation {
  if (!value || typeof value !== 'object') throw new Error('invalid-observation');
  const data = value as Record<string, unknown>;
  if (
    typeof data.videoId !== 'string' ||
    !/^[a-zA-Z0-9_-]{11}$/.test(data.videoId) ||
    typeof data.title !== 'string' ||
    !data.title.trim() ||
    data.title.length > 1000 ||
    (data.channelId !== undefined &&
      (typeof data.channelId !== 'string' || !/^UC[a-zA-Z0-9_-]{22}$/.test(data.channelId))) ||
    (data.channelHandle !== undefined &&
      (typeof data.channelHandle !== 'string' ||
        !/^@[\p{L}\p{N}_.-]{1,100}$/u.test(data.channelHandle))) ||
    (data.durationSeconds !== undefined &&
      (typeof data.durationSeconds !== 'number' ||
        !Number.isFinite(data.durationSeconds) ||
        data.durationSeconds < 0)) ||
    (data.publishedAtMs !== undefined &&
      (typeof data.publishedAtMs !== 'number' ||
        !Number.isFinite(data.publishedAtMs) ||
        data.publishedAtMs < 0)) ||
    (data.nebulaURLs !== undefined &&
      (!Array.isArray(data.nebulaURLs) ||
        data.nebulaURLs.length > 10 ||
        !data.nebulaURLs.every(isNebulaVideoURL)))
  ) {
    throw new Error('invalid-observation');
  }
  return {
    videoId: data.videoId,
    title: data.title,
    channelId: data.channelId as string | undefined,
    channelHandle: data.channelHandle as string | undefined,
    publishedAtMs: data.publishedAtMs as number | undefined,
    durationSeconds: data.durationSeconds as number | undefined,
    nebulaURLs: data.nebulaURLs as string[] | undefined,
  };
}

export function isYouTubeSender(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'www.youtube.com';
  } catch {
    return false;
  }
}
