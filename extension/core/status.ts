export function stateLabel(state: string): string {
  return (
    (
      {
        unknown: 'Creator or video not verified',
        checking: 'Checking',
        confirmed: 'Confirmed on Nebula',
        ambiguous: 'Needs your confirmation',
        'no-match': 'No match found yet',
        'retryable-error': 'Temporarily unavailable',
      } as Record<string, string>
    )[state] ?? 'Unknown'
  );
}

export function reasonLabel(reason: string): string {
  return (
    (
      {
        'sign-in-required': 'Sign in to Nebula to refresh.',
        'access-denied': 'Nebula access was denied. Sign in again.',
        'rate-limited': 'The service asked us to wait. Automatic retry is scheduled.',
        'metadata-unavailable': 'Metadata is unavailable. Cached confirmed matches still work.',
        'youtube-metadata-unavailable': 'YouTube metadata is unavailable. Try again later.',
        'creator-unverified': 'Verify this creator mapping first.',
        'creator-mismatch':
          'The Nebula video belongs to a different creator. Correct the creator mapping first.',
        'catalogue-truncated':
          'This video may be older than the bounded catalogue. Use a manual correction.',
        'handle-already-mapped': 'That YouTube handle is already mapped to a different channel.',
        'channel-verification-failed': 'The channel ID and handle could not be verified together.',
        'invalid-video-url': 'Use the canonical https://nebula.tv/videos/…/ URL.',
        'offline-or-network': 'The service could not be reached. Try again when online.',
        'request-timeout': 'The request timed out. Try again.',
      } as Record<string, string>
    )[reason] ?? 'The request could not be completed. Try again.'
  );
}
