export function nebulaVideoURL(slug: string): string {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 250) {
    throw new Error('invalid-video-slug');
  }
  return `https://nebula.tv/videos/${slug}/`;
}

export function isNebulaVideoURL(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const slug = /^https:\/\/nebula\.tv\/videos\/([a-z0-9]+(?:-[a-z0-9]+)*)\/$/.exec(value)?.[1];
  return slug !== undefined && slug.length <= 250;
}
