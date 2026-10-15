import snapshot from './creators.json';
import { catalogueURL, record, text } from './metadata';
import type { CreatorMapping } from './types';

export interface DirectoryCreator {
  id: string;
  slug: string;
  title: string;
  kind: string;
  youtube?: { channelId: string; handle: string; verifiedBy: string; verifiedAtMs: number };
}

export function parseDirectoryCreator(value: unknown): DirectoryCreator {
  const data = record(value);
  const id = text(data.id);
  const slug = text(data.slug, 100);
  catalogueURL(slug);
  if (!/^video_channel:[\w-]+$/.test(id)) throw new Error('invalid-creator-directory');
  const entry: DirectoryCreator = {
    id,
    slug,
    title: text(data.title, 1000),
    kind: text(data.kind),
  };
  if (data.youtube) {
    const youtube = record(data.youtube);
    const channelId = text(youtube.channelId);
    const handle = text(youtube.handle);
    if (!/^UC[\w-]{22}$/.test(channelId) || !/^@[\p{L}\p{N}_.-]{1,100}$/u.test(handle))
      throw new Error('invalid-creator-mapping');
    if (
      typeof youtube.verifiedAtMs !== 'number' ||
      !Number.isFinite(youtube.verifiedAtMs) ||
      youtube.verifiedAtMs <= 0
    )
      throw new Error('invalid-creator-verification-date');
    entry.youtube = {
      channelId,
      handle,
      verifiedBy: text(youtube.verifiedBy),
      verifiedAtMs: youtube.verifiedAtMs,
    };
  }
  return entry;
}

if (
  snapshot.schemaVersion !== 1 ||
  !Number.isFinite(snapshot.updatedAtMs) ||
  snapshot.updatedAtMs <= 0
)
  throw new Error('invalid-creator-registry');
export const CREATOR_DIRECTORY = snapshot.entries.map(parseDirectoryCreator);
export const REGISTRY_UPDATED_AT_MS = snapshot.updatedAtMs;
export const REGISTRY_MAPPINGS: CreatorMapping[] = CREATOR_DIRECTORY.flatMap((entry) =>
  entry.youtube && entry.kind === 'default'
    ? [
        {
          youtubeChannelId: entry.youtube.channelId,
          youtubeHandle: entry.youtube.handle,
          nebulaId: entry.id,
          slug: entry.slug,
          title: entry.title,
          source: 'verified-registry' as const,
          confirmedAtMs: entry.youtube.verifiedAtMs,
        },
      ]
    : [],
);
