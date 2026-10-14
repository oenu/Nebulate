import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';

const hosts = [
  'https://content.api.nebula.app/*',
  'https://users.api.nebula.app/*',
  'https://www.youtube.com/*',
];
// Optional local comparisons strengthen the scan without making ordinary checks
// depend on an account. Never include a private value in assertion diagnostics.
const privateValues = [];
for (const entry of await readdir('.', { withFileTypes: true })) {
  if (!entry.isFile() || !/^\.env(?:\..+)?$/.test(entry.name) || entry.name === '.env.example')
    continue;
  let values;
  try {
    values = Object.values(parseEnv(await readFile(entry.name, 'utf8')));
  } catch {
    throw new Error(`Cannot safely inspect private environment file: ${entry.name}`);
  }
  for (const value of values) {
    if (value.length < 8) continue;
    privateValues.push(value, JSON.stringify(value).slice(1, -1), encodeURIComponent(value));
  }
}
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
}
for (const target of ['chrome', 'firefox']) {
  const directory = `.output/${target}-mv3`;
  const manifest = JSON.parse(await readFile(`${directory}/manifest.json`, 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual([...manifest.host_permissions].sort(), hosts);
  assert.deepEqual([...manifest.permissions].sort(), ['alarms', 'storage']);
  assert.equal(manifest.externally_connectable, undefined);
  assert.equal(manifest.web_accessible_resources, undefined);
  assert.equal(manifest.content_security_policy, undefined);
  assert.equal(manifest.content_scripts.length, 1);
  assert.deepEqual(manifest.content_scripts[0].matches, ['https://www.youtube.com/*']);
  if (target === 'chrome') assert.equal(manifest.minimum_chrome_version, '120');
  else
    assert.deepEqual(manifest.browser_specific_settings.gecko, {
      id: 'firefox-nebulate@oenu.org',
      strict_min_version: '140.0',
      data_collection_permissions: { required: ['authenticationInfo', 'browsingActivity'] },
    });
  assert.ok(manifest.action.default_popup);
  assert.ok(manifest.options_ui.page);
  assert.ok(target === 'chrome' ? manifest.background.service_worker : manifest.background.scripts);
  const references = [
    manifest.action.default_popup,
    manifest.options_ui.page,
    ...(target === 'chrome' ? [manifest.background.service_worker] : manifest.background.scripts),
    ...Object.values(manifest.icons),
    ...manifest.content_scripts.flatMap((script) => [...(script.js ?? []), ...(script.css ?? [])]),
  ];
  for (const reference of references) await access(`${directory}/${reference}`);
  const files = await walk(directory);
  for (const file of files) {
    assert.ok(!/(^|\/)\.env|\.map$|profile|probe/i.test(file), `Unexpected artifact: ${file}`);
    if (!/\.(js|json|html|css)$/.test(file)) continue;
    const text = await readFile(file, 'utf8');
    assert.ok(
      !privateValues.some((value) => text.includes(value)),
      `Private development value embedded in ${file}`,
    );
    if (file.endsWith('.html')) {
      for (const match of text.matchAll(/(?:src|href)="([^"]+)"/g)) {
        const reference = match[1];
        assert.ok(!reference.includes('://'), `Remote executable asset in ${file}`);
        await access(`${directory}/${reference.replace(/^\//, '')}`);
      }
    }
    assert.ok(
      !/table\.oenu\.org|nebulate\.oenu|lookup_table|watchnebula\.com|localhost|127\.0\.0\.1|storage\.sync|NEBULA_PASSWORD|NEBULA_USERNAME|Authorization.{0,8}Bearer [A-Za-z0-9_-]{20}|eyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}/i.test(
        text,
      ),
      `Forbidden runtime data in ${file}`,
    );
  }
  console.log(`${target}: MV3 manifest, permissions and ${files.length} artifact files validated`);
}
