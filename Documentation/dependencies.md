# Active dependency inventory

Resolved from the npm registry latest stable tags on 2026-10-14. Exact direct versions and the root bun.lock are authoritative. Use Node 26+ (verified 26.8.2), Bun 1.4.3+ (registry stable 1.4.3); bun install --frozen-lockfile at the root. backend/ and its historical yarn lockfile are inactive reference material, outside installation and checks.

| Package | Stable version | Runtime | Peers |
| --- | --- | --- | --- |
| wxt | 0.21.4 | {"bun":">=1.2.0","node":">=22"} | {"vite":"^6.3.4 || ^7.0.0 || ^8.0.0-0","eslint":"^8.57.0 || ^9.0.0 || ^10.0.0","web-ext":">=9.2.0","typescript":">=5.4"} |
| @wxt-dev/module-react | 1.2.2 | {} | {"wxt":">=0.19.16","vite":"^5.4.19 || ^6.3.4 || ^7.0.0 || ^8.0.0-0"} |
| react | 19.3.1 | {"node":">=0.10.0"} | {} |
| react-dom | 19.3.1 | {} | {"react":"^19.3.1"} |
| @mantine/core | 9.7.2 | {} | {"react":"^19.2.0","react-dom":"^19.2.0","@mantine/hooks":"9.7.2"} |
| @mantine/hooks | 9.7.2 | {} | {"react":"^19.2.0"} |
| @tabler/icons-react | 3.49.0 | {} | {"react":">= 16"} |
| idb | 8.0.4 | {} | {} |
| typescript | 7.0.2 | {"node":">=16.20.0"} | {} |
| vitest | 5.0.4 | {"node":"^22.12.0 || ^24.0.0 || >=26.0.0"} | {"vite":"^6.4.0 || ^7.0.0 || ^8.0.0","jsdom":"*","happy-dom":"*","@vitest/ui":"5.0.4","@types/node":"^22.0.0 || >=24.0.0","@edge-runtime/vm":"*","@opentelemetry/api":"^1.9.0","@vitest/coverage-v8":"5.0.4","@vitest/browser-preview":"5.0.4","@vitest/coverage-istanbul":"5.0.4","@vitest/browser-playwright":"5.0.4","@vitest/browser-webdriverio":"^5.0.0-beta.5 || >=5.0.0"} |
| fake-indexeddb | 6.2.5 | {"node":">=18"} | {} |
| happy-dom | 21.0.1 | {"node":">=20.0.0"} | {} |
| @types/react | 19.3.0 | {} | {} |
| @types/react-dom | 19.3.0 | {} | {"@types/react":"^19.3.0"} |
| @types/node | 26.6.5 | {} | {} |
| @biomejs/biome | 2.5.15 | {"node":">=14.21.3"} | {} |
| playwright | 1.64.1 | {"node":">=20"} | {} |
| selenium-webdriver | 4.51.0 | {"node":">= 22.0.0"} | {} |
| geckodriver | 8.0.0 | {"node":">=22.19.0"} | {"@wdio/logger":"^9.18.0 || ^10.0.0"} |

Retained and migrated: React 17 to 19, Mantine 5 to 9 with package CSS and createRoot, TypeScript 4 to 7. @tabler/icons is replaced by @tabler/icons-react. WXT replaces duplicated Webpack/copy/style/CSS loaders and packaging/signing scripts; Vitest replaces Jest/ts-jest. Biome supplies local lint and formatting. idb supplies typed IndexedDB; fake-indexeddb and happy-dom are test-only. playwright/selenium-webdriver/geckodriver are explicitly invoked local browser tools and are never shipped.

Removed from the active graph: Emotion, csstype, old browser type packages (WXT owns browser typing), Webpack and loader/plugin tooling, glob/rimraf/copy/prettier/Jest types, signing tools and hosted-backend update scripts. No transitive overrides are used. Backend dependencies are unchanged and inactive. Optional tool peers are not force-installed; actual resolved peer validation is recorded in the work log.

User-requested package manager revision: the uncommitted npm lockfile was migrated to Bun and removed. Bun is the single active package manager. Use bun run --no-env-file check; retain Node for upstream tool shebangs and node --test. Dependency postinstall scripts are not broadly trusted; geckodriver downloads only when the explicit browser harness requests it.
