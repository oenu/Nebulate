// WXT loads .env files from cwd. Use an empty directory instead of the private
// root; Vite's environment exposure is also disabled in wxt.config.ts.
import { fileURLToPath } from 'node:url';
import { mkdir } from 'node:fs/promises';
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = new URL('../.local/build-environment/', import.meta.url);
await mkdir(directory, { recursive: true });
process.chdir(fileURLToPath(directory));
const { build, prepare, createServer } = await import('wxt');
const [command, browser = 'chrome'] = process.argv.slice(2);
if (!['prepare', 'build', 'dev'].includes(command) || !['chrome', 'firefox'].includes(browser)) {
  throw new Error('invalid-local-build-command');
}
const config = { root, browser, manifestVersion: 3 };
if (command === 'prepare') await prepare(config);
else if (command === 'build') await build(config);
else await (await createServer(config)).start();
