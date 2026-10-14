import type {
  CreatorMapping,
  ManualOverride,
  MatchDecision,
  NebulaVideo,
  Observation,
} from './types';

export const MINUTE_MS = 60_000;
export const NEGATIVE_TTL_MS = 15 * MINUTE_MS;
export const CONFIRMED_TTL_MS = 7 * 24 * 60 * MINUTE_MS;

export function normalizedTitle(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[’‘]/g, "'")
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

export function fingerprint(observation: Observation): string {
  return JSON.stringify([
    normalizedTitle(observation.title),
    observation.channelId ?? '',
    observation.channelHandle?.toLowerCase() ?? '',
    observation.durationSeconds ?? null,
    observation.publishedAtMs ?? null,
    [...(observation.nebulaURLs ?? [])].sort(),
  ]);
}

export function resolveCreator(
  observation: Observation,
  mappings: CreatorMapping[],
): CreatorMapping | undefined {
  if (observation.channelId)
    return mappings.find((m) => m.youtubeChannelId === observation.channelId);
  if (!observation.channelHandle) return undefined;
  const matches = mappings.filter(
    (m) => m.youtubeHandle?.toLowerCase() === observation.channelHandle?.toLowerCase(),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export function titleScore(a: string, b: string): number {
  const left = new Set(normalizedTitle(a).split(' ').filter(Boolean));
  const right = new Set(normalizedTitle(b).split(' ').filter(Boolean));
  if (!left.size || !right.size) return 0;
  const common = [...left].filter((word) => right.has(word)).length;
  return common / new Set([...left, ...right]).size;
}

export function matchVideo(
  observation: Observation,
  mapping: CreatorMapping | undefined,
  videos: NebulaVideo[],
  now: number,
  override?: ManualOverride,
): MatchDecision {
  const base = {
    videoId: observation.videoId,
    fingerprint: fingerprint(observation),
    checkedAtMs: now,
    expiresAtMs: now + NEGATIVE_TTL_MS,
    creatorSlug: mapping?.slug,
  };
  if (override)
    return {
      ...base,
      state: override.nebulaId === null ? 'no-match' : 'confirmed',
      url: override.url,
      nebulaId: override.nebulaId ?? undefined,
      reason: 'manual',
      expiresAtMs: Number.MAX_SAFE_INTEGER,
    };
  if (!mapping) return { ...base, state: 'unknown', reason: 'creator-unverified' };
  const eligible = videos.filter(
    (v) => v.creatorId === mapping.nebulaId && v.creatorSlug === mapping.slug,
  );
  const explicit = eligible.filter((v) => observation.nebulaURLs?.includes(v.url));
  const ranked = eligible
    .map((video) => ({ video, score: titleScore(observation.title, video.title) }))
    .sort((a, b) => b.score - a.score || a.video.id.localeCompare(b.video.id));
  const candidates = ranked
    .slice(0, 5)
    .map(({ video }) => ({ id: video.id, title: video.title, url: video.url }));
  if (explicit.length === 1)
    return {
      ...base,
      state: 'confirmed',
      url: explicit[0]?.url,
      nebulaId: explicit[0]?.id,
      score: 1,
      reason: 'explicit-link',
      expiresAtMs: now + CONFIRMED_TTL_MS,
    };
  if (explicit.length > 1)
    return { ...base, state: 'ambiguous', reason: 'multiple-explicit-links', candidates };
  const best = ranked[0];
  const score = best?.score ?? 0;
  if (!best || score < 0.65)
    return { ...base, state: 'no-match', score, reason: 'no-candidate', candidates };
  const exact = normalizedTitle(best.video.title) === normalizedTitle(observation.title);
  const durationSupports =
    observation.durationSeconds !== undefined &&
    Math.abs(observation.durationSeconds - best.video.durationSeconds) <=
      Math.max(30, best.video.durationSeconds * 0.12);
  const dateSupports =
    observation.publishedAtMs !== undefined &&
    Math.abs(observation.publishedAtMs - best.video.publishedAtMs) <= 45 * 24 * 60 * MINUTE_MS;
  const dateConflicts = observation.publishedAtMs !== undefined && !dateSupports;
  const duplicate = ranked[1] && score - ranked[1].score < 0.12;
  if (
    duplicate ||
    dateConflicts ||
    (!exact && !(score >= 0.88 && durationSupports && dateSupports)) ||
    normalizedTitle(observation.title).length < 12
  ) {
    return {
      ...base,
      state: 'ambiguous',
      score,
      reason: 'insufficient-distinct-evidence',
      candidates,
    };
  }
  return {
    ...base,
    state: 'confirmed',
    score,
    reason: exact ? 'exact-title-and-creator' : 'title-date-duration',
    url: best.video.url,
    nebulaId: best.video.id,
    expiresAtMs: now + CONFIRMED_TTL_MS,
  };
}

export function isFresh(decision: MatchDecision, observation: Observation, now: number): boolean {
  return (
    decision.reason === 'manual' ||
    (decision.fingerprint === fingerprint(observation) && decision.expiresAtMs > now)
  );
}
