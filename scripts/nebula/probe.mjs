import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { fileURLToPath } from 'node:url';
import { catalogue, probeSession, safeError, ProbeError } from './api.mjs';

export function credentialsFromEnv(text) {
  const env = parseEnv(text);
  // Compatibility with the existing private file; no need to modify or print it.
  const email = env.NEBULA_USERNAME ?? env.uname;
  const password = env.NEBULA_PASSWORD ?? env.pass;
  if (!email || !password) throw new ProbeError('missing-credentials');
  return { email, password };
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes('--live') && !args.includes('--public')) {
    console.log('Usage: node scripts/nebula/probe.mjs --public | --live [--write-fixtures]');
    return;
  }
  if (args.some(a => !['--live', '--public', '--write-fixtures'].includes(a)) ||
      (args.includes('--live') && args.includes('--public'))) throw new ProbeError('invalid-arguments');
  const report = value => console.log(JSON.stringify(value));
  const data = args.includes('--live')
    ? await probeSession({ ...credentialsFromEnv(await readFile(new URL('../../.env.local', import.meta.url), 'utf8')), report })
    : await catalogue();
  if (args.includes('--public')) report({ step: 'public-catalogue', result: 'ok', pages: data.pages,
    videos: data.videos.length, primaryCreatorVideos: data.videos.filter(v => v.primaryCreatorMatches).length, hasMore: data.hasMore });
  if (args.includes('--write-fixtures')) {
    await mkdir(new URL('../../test/nebula/fixtures/', import.meta.url), { recursive: true });
    await writeFile(new URL('../../test/nebula/fixtures/notjustbikes.json', import.meta.url),
      `${JSON.stringify({ source: 'First-party public catalogue; allowlisted fields only', retrievedOn: new Date().toISOString().slice(0, 10), ...data }, null, 2)}\n`);
    report({ step: 'sanitized-fixture', result: 'written' });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.log(JSON.stringify({ result: 'failed', ...safeError(error) })); process.exitCode = 1; });
}
