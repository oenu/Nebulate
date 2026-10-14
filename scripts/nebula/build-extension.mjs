import { mkdir, writeFile, copyFile } from 'node:fs/promises';

for (const target of ['chrome', 'firefox']) {
  const directory = new URL(`../../probes/nebula-extension/${target}/`, import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('manifest.json', directory), JSON.stringify({
    manifest_version: 3, name: 'Nebulate feasibility probe', version: '0.0.1',
    permissions: ['storage'],
    host_permissions: ['https://users.api.nebula.app/*', 'https://content.api.nebula.app/*'],
    background: target === 'chrome' ? { service_worker: 'background.js', type: 'module' } : { scripts: ['background.js'], type: 'module' },
    ...(target === 'firefox' ? { browser_specific_settings: { gecko: { id: 'nebulate-probe@local.invalid', strict_min_version: '140.0', data_collection_permissions: { required: ['authenticationInfo'] } } } } : {}),
    content_scripts: [{ matches: ['https://www.youtube.com/*'], js: ['content.js'] }],
  }, null, 2));
  await copyFile(new URL('api.mjs', import.meta.url), new URL('api.mjs', directory));
  for (const file of ['background.js', 'probe.html', 'probe.js', 'content.js']) {
    await copyFile(new URL(`../../probes/nebula-extension/${file}`, import.meta.url), new URL(file, directory));
  }
}
console.log('Built disposable Chrome and Firefox MV3 probes; no environment files copied.');
