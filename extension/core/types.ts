export interface CreatorMapping {
  youtubeChannelId: string;
  youtubeHandle?: string;
  nebulaId: string;
  slug: string;
  title: string;
  confirmedAtMs: number;
  source: 'verified-seed' | 'verified-registry' | 'manual';
}

export interface NebulaVideo {
  id: string;
  slug: string;
  title: string;
  creatorId: string;
  creatorSlug: string;
  publishedAtMs: number;
  durationSeconds: number;
  url: string;
}

export interface Observation {
  videoId: string;
  title: string;
  channelId?: string;
  channelHandle?: string;
  publishedAtMs?: number;
  durationSeconds?: number;
  nebulaURLs?: string[];
}

export type MatchState =
  | 'unknown'
  | 'checking'
  | 'confirmed'
  | 'ambiguous'
  | 'no-match'
  | 'retryable-error';
export interface MatchDecision {
  videoId: string;
  state: MatchState;
  fingerprint: string;
  creatorSlug?: string;
  url?: string;
  nebulaId?: string;
  score?: number;
  reason: string;
  checkedAtMs: number;
  expiresAtMs: number;
  candidates?: Pick<NebulaVideo, 'id' | 'title' | 'url'>[];
}

export interface ManualOverride {
  videoId: string;
  observation: Observation;
  nebulaId: string | null;
  url?: string;
  updatedAtMs: number;
}

export interface RefreshJob {
  slug: string;
  generation: string;
  status: 'refreshing' | 'idle' | 'retry';
  nextURL: string | null;
  pages: number;
  startedAtMs: number;
  updatedAtMs: number;
  leaseUntilMs: number;
  retryAtMs: number;
  error?: string;
  complete: boolean;
  failures?: number;
}

export interface Preferences {
  version: 1;
  showVideoButton: boolean;
  highlightVideo: boolean;
  preferNewTab: boolean;
  buttonColor: string;
  thumbnails: boolean;
}
