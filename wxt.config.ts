import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'extension',
  publicDir: 'extension/public',
  modules: ['@wxt-dev/module-react'],
  imports: false,
  manifestVersion: 3,
  manifest: ({ browser }) => ({
    name: 'Nebulate',
    description:
      'Find confirmed Nebula videos while browsing YouTube. Matches stay on this device.',
    permissions: ['storage', 'alarms'],
    host_permissions: [
      'https://users.api.nebula.app/*',
      'https://content.api.nebula.app/*',
      'https://www.youtube.com/*',
    ],
    icons: { 128: 'icon.png' },
    ...(browser === 'firefox'
      ? {
          browser_specific_settings: {
            gecko: {
              id: 'firefox-nebulate@oenu.org',
              strict_min_version: '140.0',
              data_collection_permissions: { required: ['authenticationInfo', 'browsingActivity'] },
            },
          },
        }
      : { minimum_chrome_version: '120' }),
  }),
  vite: () => ({ envDir: false, envPrefix: [] }),
});
