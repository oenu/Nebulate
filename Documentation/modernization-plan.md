# Nebulate extension modernization plan

## Objective and accepted decisions

Modernize Nebulate so it discovers and matches YouTube and Nebula videos entirely inside the browser extension. Preserve the existing buttons, highlighting, and visual identity for the first milestone. Users must not need a Node helper, MongoDB, Cloudflare R2, or a hosted lookup table. Fresh metadata and playback still require access to YouTube and Nebula.

The first product milestone is one creator working end to end: read a YouTube video, retrieve current Nebula candidates, confidently match it, persist the result, and show a working redirect. Validate Nebula authentication and metadata access in a real extension before expanding the migration.

- Working branch: `modernize/local-extension`.
- Starting commit: `965c2d2`, from `origin/firefox-quereySelector-compatibility`.
- Historical branches stay unchanged. The older backend remains reference material and is excluded from the modern dependency graph.
- Checks run locally only. No GitHub Actions, hosted CI, pushes, store uploads, signing, or remote configuration changes are part of this work.
- Upgrade all retained direct dependencies to their latest stable releases at implementation time. Include major migrations; remove unused packages. Record any exception instead of silently selecting an older release.
- Target Chrome and Firefox with explicit Manifest V3 builds. Use WXT, TypeScript, React, Mantine, and Vitest; verify the current compatible package set before installation.
- Store metadata and matches in IndexedDB. Store preferences locally. Keep authentication in privileged extension contexts and out of content scripts and browser sync.
- Follow-up accepted scope: bundle the complete current Nebula creator directory and verified YouTube channel mappings with app updates. Match videos as the user browses, refreshing each encountered mapped creator subject to freshness/backoff even when the encountered video has a cached match. Directory maintenance is separate from fetching every creator's video catalogue.

## How agents use this checklist

Read `AGENTS.md` first. Each item has a stable ID. `[ ]` means unfinished, including in-progress and blocked work; `[x]` means completed with evidence. Describe in-progress or blocked status in the work log, rather than inventing another checkbox syntax.

Before editing, claim specific item IDs in the work log with an owner, affected files, and planned verification. Work in phase order unless an item explicitly allows independent progress. Phase 2 is the feasibility gate for the broad migration. A phase is complete only when all its checklist items and its acceptance criterion are satisfied.

Use one owner per item. If a session explicitly assigns parallel agents, agree on non-overlapping file ownership and one integration owner for shared files and the checklist. An assignment does not count as completion. Do not switch branches in a shared checkout while another worker is editing.

After implementation, record commands, results, relevant artifacts, and limitations in the work log; then check the completed items. Include checklist updates with the implementation change. Do not write credentials, tokens, private API payloads, or user account details into evidence. Browser screenshots and fixtures must be sanitized.

If blocked, leave the item unchecked and record the exact obstacle and next action. A passing mock test does not establish live API compatibility. A passing build does not establish browser acceptance. When handing off, identify the next ready item and any local processes or uncommitted work that need attention.

## Phase 1 Establish the branch and local setup

- [x] P1.1 Create `modernize/local-extension` from `965c2d2` without modifying historical branch tips.
- [x] P1.2 Ignore `.env` and `.env.*`, allow a placeholder-only `.env.example`, and verify private environment files are untracked and ignored.
- [x] P1.3 Remove GitHub Actions workflows on this branch. Do not change remote settings or historical branches.
- [x] P1.4 Add this plan and root agent instructions with ownership, verification, and handoff rules.
- [x] P1.5 Establish the modern project layout, one active package manager/lockfile, supported runtime requirements, and install instructions. Keep `backend/` as an inactive reference, outside active installation and checks.
- [x] P1.6 Add the local commands described below as the toolchain becomes available. Document which require installed browsers and which require a live account.

Acceptance: the modernization branch is isolated, credentials are excluded, and a contributor can install and check the active extension locally without GitHub Actions. P1.5 and P1.6 may finish during Phase 3 after the Phase 2 feasibility gate.

## Phase 2 Validate current Nebula access

Dependencies: P1.1 through P1.4. Use a minimal disposable or narrowly scoped probe before the broad toolchain migration.

- [x] P2.1 Identify and verify the current Nebula authentication and catalogue endpoints, redirects, request formats, and required permissions. Treat the 2022 endpoint assumptions as unverified.
- [x] P2.2 Implement a local development probe that loads `.env.local` programmatically. Redact all sensitive request/response data and constrain credential submission to verified Nebula authentication endpoints.
- [x] P2.3 Verify login, token expiry/renewal, logout behaviour, creator lookup, video pagination, unavailable metadata, and rate-limit responses. Document what is observed and what remains simulated.
- [x] P2.4 Verify catalogue requests from unpacked Chrome and Firefox extensions with minimal host permissions. A successful Node probe alone is insufficient.
- [x] P2.5 Choose the runtime sign-in mechanism based on those results. Keep passwords out of persistence; minimize token storage, restrict access to privileged contexts, clear it on logout, and verify browser-specific behaviour.
- [x] P2.6 Select one creator and known matching/unmatched examples. Save sanitized metadata fixtures and document the verified response contract.
- [x] P2.7 Record the feasibility decision. If browser authentication or catalogue access is blocked, describe the blocker and extension-only alternatives before proceeding with architecture that depends on it.

Acceptance: the extension retrieves one creator's current metadata and recovers from an expired session in both target browsers. Any simulated or unverified part is explicit. No remote proxy or local runtime helper is introduced.

## Phase 3 Modernize packages and builds

Dependencies: Phase 2 feasibility decision. Complete P1.5 and P1.6 here.

- [x] P3.1 Inventory retained, replaced, and removed dependencies. Resolve current stable releases from the registry and record the resolution date, package versions, and runtime/peer requirements.
- [x] P3.2 Migrate duplicated Webpack configurations to WXT with explicit Chrome and Firefox Manifest V3 targets. Preserve required assets and extension identity where compatible.
- [x] P3.3 Upgrade TypeScript, React, React DOM, Mantine, icons, browser APIs/types, and all other retained direct dependencies. Perform required API/CSS migrations; remove obsolete packages and unnecessary type packages.
- [x] P3.4 Introduce Vitest and current lint/format tooling. Commit the chosen lockfile and document a reproducible frozen-lockfile install. Do not install the legacy backend as part of it.
- [x] P3.5 Implement local lint, typecheck, test, browser build, and aggregate check commands. Keep live probes separate. Remove obsolete scripts referencing old paths, signing, or the hosted backend from the active workflow.
- [x] P3.6 Build and load both browser targets, checking manifests, permissions, popup/options rendering, and background startup. Record any latest-version compatibility exception and its resolution plan.

Acceptance: a clean local install produces working Chrome and Firefox extension shells, with type checking, linting, and initial tests passing. The active dependency set uses current stable direct releases or explicitly documented unresolved exceptions.

## Phase 4 Implement local storage and matching

Dependencies: Phase 2 metadata contract and Phase 3 toolchain.

- [x] P4.1 Define typed creator mappings, Nebula metadata, YouTube observations, match decisions, manual overrides, cache timestamps, and refresh checkpoints. Validate external responses at the boundary.
- [x] P4.2 Implement versioned IndexedDB storage with indexes for direct video/creator lookup, migrations, bounded retention, and atomic updates. Keep preferences local and account state separate.
- [x] P4.3 Extract matching into pure TypeScript functions, independent of Mongoose. Prioritize explicit links and confirmed creator identity; handle score zero correctly. Use conservative title matching with available supporting metadata and ambiguity thresholds.
- [x] P4.4 Represent unknown, checking, confirmed, ambiguous, no-match, and retryable-error states distinctly. Expire negative results so later Nebula releases can be found. Account for publication delays and edited titles.
- [x] P4.5 Support manual confirmations and corrections that survive refreshes; prevent one video being silently reassigned to a conflicting match.
- [x] P4.6 Test exact/near matches, unrelated creators, duplicate titles, ambiguous candidates, publication delays, score-zero handling, corrections, expiry, and migrations using sanitized fixtures.

Acceptance: deterministic local tests establish matching and cache behaviour without a live account or database server. Uncertain or failed requests never become confirmed redirects or permanent negative results.

## Phase 5 Deliver one creator end to end

Dependencies: Phases 2 through 4. Keep scope to one creator and the watch page initially.

- [x] P5.1 Read video ID, title, and creator identity from the current YouTube page through a replaceable page adapter. Handle initial page load and same-tab navigation.
- [x] P5.2 Connect observations to the privileged background request/matching pipeline. Validate message payloads and permitted request destinations; never allow page messages to request arbitrary authenticated URLs.
- [x] P5.3 Display the existing watch button/highlight only for confirmed matches. Reuse the visual identity, remove stale state on navigation, and verify the destination URL.
- [x] P5.4 Fix observer ownership and cleanup so each page lifecycle owns its observers and event handlers. Prevent duplicate buttons and callbacks after repeated navigation.
- [x] P5.5 Use consistent refresh timestamps and explicit time units. Replace the `lastUpdate`/`lastUpdated` inconsistency with a tested freshness contract; migrate retained data where applicable.
- [x] P5.6 Test the watch-page flow with sanitized fixtures, including delayed responses arriving after navigation, unmatched videos, and expired sessions.
- [x] P5.7 Verify the real creator in Chrome and Firefox: correct redirect, no false button on an unmatched video, cache persistence after browser restart, and no old lookup-table/backend requests.

Acceptance: one creator works entirely inside both browser extensions. Record the exact live scenarios and outcomes. The backend and hosted table can remain unavailable throughout this acceptance run.

## Phase 6 Expand browsing and recovery

Dependencies: Phase 5 acceptance.

- [ ] P6.1 Extend page adapters to home, search, subscriptions, channel pages, and recommendations. Verify current page structures and navigation; do not assume the 2022 selectors remain correct.
- [x] P6.2 Keep a complete Nebula creator directory and current verified YouTube mappings, updateable with app builds. Validate historical candidates before use, provide a correction path, and keep unknown creators unresolved until identity is established.
- [x] P6.3 Fetch video catalogues only for encountered creators, including cached video encounters; deduplicate requests across tabs, bound concurrency, and use freshness intervals, timeouts, pagination limits, cancellation, and rate-limit backoff.
- [x] P6.4 Persist refresh checkpoints and retry state. Recover from worker termination and browser restart without relying on process-global state or indefinite timers. Do not let concurrent jobs overwrite newer results.
- [x] P6.5 Add popup/options controls for sign-in status, refresh status, cache management, and manual corrections. Clearly distinguish checking, no match, unavailable metadata, and sign-in required.
- [x] P6.6 Verify local preferences and useful existing settings migrate safely. Cache clearing and logout must have explicit, tested effects on metadata, overrides, and authentication.
- [x] P6.7 Test multi-tab requests, repeated navigation, offline periods, rate limits, stale responses, interrupted refreshes, and session recovery. Keep confirmed cached matches usable when fresh metadata is unavailable.

Acceptance: normal browsing across all supported surfaces remains responsive, creates no duplicate observers/buttons, and recovers without a helper service or full-catalogue scrape.

## Phase 7 Complete local acceptance and documentation

Dependencies: Phase 6. Add focused regression tests during earlier phases rather than deferring all testing here.

- [x] P7.1 Run the aggregate local check from a reproducible installation: lint, type checking, deterministic tests, Chrome build, Firefox build, and manifest/package validation. No live credentials are needed.
- [ ] P7.2 Run explicit account-backed acceptance separately in Chrome and Firefox. Cover login/logout, renewal, real matches, unmatched videos, each browsing surface, restart persistence, and recovery.
- [x] P7.3 Inspect generated artifacts for environment files, embedded credentials/tokens, unnecessary permissions, and old lookup-table/backend URLs. The scanner must report file locations/results without printing secret values.
- [x] P7.4 Confirm runtime network activity is limited to the intended service requests and contains no calls to the old lookup service. Confirm metadata/preferences remain local and no account data enters browser sync.
- [x] P7.5 Document installation, runtime sign-in, local commands, cache/override behaviour, troubleshooting, supported browser versions, and remaining acceptance limitations. Historical setup instructions must be clearly distinguished.
- [x] P7.6 Review the final diff and active dependency inventory, verify no GitHub Actions workflows were reintroduced, and prepare a local handoff with branch, commit, checks, and outstanding work. Do not publish or push.

Acceptance: both browser artifacts pass local checks and documented live acceptance, run without a helper/backend, and can be installed using the repository instructions. Unperformed acceptance prevents claiming full completion.

## Planned local commands

These are intended interfaces, not commands available at the initial planning commit. Choose and document one package manager in P1.5; expose these script names or document an equivalent interface.

| Command | Purpose | Live account |
| --- | --- | --- |
| `lint` | Static lint checks without automatic edits | No |
| `typecheck` | TypeScript validation | No |
| `test` | Deterministic unit/integration tests in non-watch mode | No |
| `build:chrome` | Local Chrome Manifest V3 build | No |
| `build:firefox` | Local Firefox Manifest V3 build | No |
| `check` | Aggregate checks and both builds, including artifact validation | No |
| `dev:chrome` / `dev:firefox` | Start an unpacked development extension | Only for live matching |
| `probe:nebula` | Explicit, sanitized authentication/catalogue probe | Yes |

Browser acceptance is a separate documented procedure. Do not claim Firefox acceptance based only on Chromium automation. Local build artifacts, test profiles, and authenticated probe outputs must be ignored as they are introduced.

## Known starting issues

- `extension/src/background/table/downloadTable.ts` fetches the hosted lookup table. Its data provider must be replaced.
- `extension/src/background/table/updateTable.ts` writes `lastUpdate`, while `listeners/onStartup.ts` reads `lastUpdated` and compares milliseconds to a minutes-based interval.
- `extension/src/content/listeners/onNewThumbnails.ts` assigns a new observer to a local parameter and can create another in its caller, leaving duplicate observers.
- `backend/src/models/nebulaVideo/methods/rematch.ts` couples title matching to Mongoose and treats zero scores as absent. The replacement needs explicit score checks and ambiguity handling.
- Historical tests mainly cover database storage. They do not establish current extension, API, or browser compatibility.

## Work log

Append or update one entry per coherent task. Use this template:

```text
Date and owner:
Item IDs:
Status: in progress | blocked | complete
Files owned or changed:
Decision or implementation:
Verification commands and results:
Live checks performed and unperformed:
Blockers or limitations:
Next action:
Commit or artifact reference, if available:
```

### Initial setup

- Date and owner: 2026-10-14, initial setup agent.
- Item IDs: P1.1 through P1.4.
- Status: complete.
- Files changed: `.gitignore`, `.env.example`, `AGENTS.md`, this plan, a navigation note in `readme.md`, and removal of `.github/workflows/tests.yml`.
- Implementation: created the requested local branch from `965c2d2`, protected private environment files, added agent checklists, and removed hosted CI on this branch.
- Verification: `git diff --check` passed; `git branch -avv` and `git log -1` confirmed the branch/base and unchanged historical tips; `git check-ignore -v .env .env.local backend/.env.local extension/.env.production` confirmed coverage. A one-off Python validation passed for all 45 unique checklist IDs across seven phases, four completed setup items, relative links, blank example values, preservation of `.env.local` by path only, and absence of workflow YAML. Staged-file review is required before committing this setup.
- Live checks: none. Credentials were not read or used. Application builds and tests were not run for this documentation/configuration-only setup.
- Limitations: P1.5/P1.6 and all application phases remain unfinished. The commands above are planned interfaces. Remote Actions settings and historical branch workflows are unchanged.
- Next action: claim P2.1 and validate current Nebula endpoints before sending credentials or choosing a runtime authentication design.

### Nebula feasibility probe

- Date and owner: 2026-10-14, Codex (integration owner).
- Item IDs: P2.1–P2.7.
- Status: in progress.
- Intended files: `scripts/nebula/`, `test/nebula/`, `probes/nebula-extension/`, `Documentation/nebula-access.md`, `.gitignore`, `.env.example`, this plan.
- Planned implementation: verify first-party website endpoint references and redirect behaviour without credentials; create a dependency-free, explicitly invoked, sanitized local probe and minimal Chrome/Firefox MV3 probe shells. Keep broad migration behind the feasibility decision.
- Planned verification: Node built-in tests with sanitized responses; explicit credential-backed login/catalogue/renewal/logout probe only after endpoint verification; inspect and load both minimal browser targets where available. Check ignored credentials and `git diff --check` before handoff.
- Initial evidence: clean branch `modernize/local-extension` at `67a86e1`; Node `26.8.2`, npm `11.19.1`; root `.env.local` exists (key names `uname` and `pass`, values not printed); Google Chrome installed; `/Applications/Firefox.app` absent. No application checks or authenticated requests performed yet.
- Next action: inspect the current Nebula website assets and HTTPS responses before authorizing any credential destination.

### Feasibility gate result and toolchain claim

- Date and owner: 2026-10-14, Codex (integration owner).
- Item IDs: P2.1–P2.7 complete; P1.5, P1.6, P3.1–P3.6 claimed in progress.
- Files changed for Phase 2: scripts/nebula/, probes/nebula-extension/ source, test/nebula/, Documentation/nebula-access.md, .gitignore, this plan.
- Verification: node --test test/nebula/api.test.mjs passed 7 tests; node scripts/nebula/build-extension.mjs passed; node scripts/nebula/probe.mjs --live passed login, authorization, two catalogue pages, token reissue, missing creator 404, logout and revoked-key 401.
- Browser evidence: PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/nebula/browser-probe.mjs chrome --live and the firefox --live variant both passed, sequentially, using Chromium 156.0.8078.4 and Firefox 157.0 (Playwright binaries), Selenium 4.51.0/geckodriver 0.37.1 for Firefox. Both retrieved four public metadata records across two pages; the deliberately invalid bearer received 403, renewing recovered catalogue access; logout revoked the key (401). Privileged session marker roundtripped; a real YouTube content script could not read it in either browser. No account responses, traces or screenshots saved.
- Feasibility decision: proceed with extension-only direct first-party requests and runtime sign-in from an extension page; key/token in privileged storage.session only, cleared on logout and browser restart; passwords never persisted. Cross-promoted episodes require primary creator identity checks. Seed and public metadata contract are recorded in Documentation/nebula-access.md.
- Limitations: natural token expiry was not waited out (rejected-bearer recovery exercised instead); rate limiting was simulated, not induced. Browser tests are headless local development binaries, not manual release-browser acceptance. Firefox needed isolated macOS app data for upstream bug 2060476 and privileged automation access to open its extension page; these are test harness settings, not shipped extension permissions.
- Phase 3 intended files: root package.json/package-lock.json, wxt.config.ts, tsconfig.json, biome.json, extension/entrypoints/, extension/core/, retained public artwork, scripts/check-artifacts.mjs, Documentation/dependencies.md, installation docs; retire active legacy Webpack/Jest scripts and source after replacement. backend/ remains untouched and excluded.
- Phase 3 planned verification: registry-resolved current direct releases and peer/runtime inspection; frozen npm install, lint/typecheck/Vitest, explicit Chrome/Firefox MV3 builds, artifact inspection and both loaded shells.
- Next action: resolve the active dependency inventory from the npm registry and implement the WXT shell.

### Modern toolchain and local shell

- Date and owner: 2026-10-14, Codex (integration owner).
- Item IDs: P1.5, P1.6, P3.1–P3.6 complete.
- Files changed: root package.json/package-lock.json, wxt.config.ts, tsconfig.json, biome.json, vitest.config.ts, extension/entrypoints and core shell, retained artwork, scripts/wxt.mjs, scripts/check-artifacts.mjs, scripts/browser-driver.mjs and browser-shell.mjs, readme.md, Documentation/dependencies.md and historical-setup.md. Removed obsolete extension src, Webpack configurations, manifests/HTML/CSS copies, package manifest/yarn lockfile, tsconfig and Jest config. backend/ unchanged.
- Implementation: npm root installation with exact current stable direct versions resolved from registry (React 19.3.1, Mantine 9.7.2, TypeScript 7.0.2, WXT 0.21.4, Vitest 5.0.4, Biome 2.5.15); npm ls --depth=0 passed with no incompatible peers. No overrides. Optional signing/publication tools not invoked. Build wrapper runs outside root .env directory; Vite exposure disabled. Firefox historical add-on ID retained.
- Verification: npm run check passed lint, typecheck, 7 Node tests plus 1 focused redirect URL test, both explicit MV3 builds and artifact validation; browser-shell.mjs chrome and firefox both rendered popup/options and returned ready from background. npm ci --no-audit --no-fund used for reproducible reinstall (result to be confirmed below).
- Live checks: Phase 2 account evidence remains separate; shell tests are credential-free headless development browsers. No manual release-browser visual acceptance claimed.
- Next action: P4.1–P4.6 claimed in progress, owner Codex; intended files extension/core/{types,metadata,matching,storage}.ts and test/modern/{matching,storage}.test.ts. Implement validated metadata, conservative pure matching and versioned IndexedDB with conflict-safe overrides and expiry. Planned verification: deterministic tests for identity, ambiguity, score zero, publication delays, corrections, cache retention/expiry and migrations.

### Local storage and matching

- Date and owner: 2026-10-14, Codex.
- Item IDs: P4.1–P4.6 complete.
- Files changed: extension/core/{types,metadata,matching,storage,urls}.ts; test/modern/{matching,storage,shell}.test.ts.
- Implementation: validated first-party metadata and pagination URLs; pure title/creator matching with explicit-link priority, duplicate ambiguity, near-title date/duration support, zero scores, edited-title fingerprints and millisecond expiry; IndexedDB v2 with lookup indexes, upgrade migration, atomic corrections, stale-write/conflict protection and bounded retention. Cross-promotion membership is not creator identity.
- Verification: npm run typecheck passed; npm test passed 7 Node tests plus 12 Vitest tests, including exact/near matches, identity mismatch, duplicate candidates, publication delays/expiry, zero score, response boundary rejection, v1-to-v2 migration, stale writes, manual corrections, cache clearing/reopen and retention. npm ci --no-audit --no-fund also passed for Phase 3.
- Live checks: none for this deterministic layer; no account/database/helper required.
- Next action: P5.1–P5.7 claimed in progress, owner Codex; intended files extension/core/{auth,client,pipeline,messages,youtube,watch}.ts, background/content entrypoints, minimal runtime sign-in UI and focused auth/navigation tests. Verify watch flow with fixtures, load current YouTube in both targets, test real seed match, conservative unmatched example and restart persistence separately.

### Package manager change requested by user

- Date and owner: 2026-10-14, Codex.
- Item IDs: P1.5, P1.6, P3.4, P3.5, P7.5; in progress as a user-requested revision.
- Files intended: package.json, bun.lock, removal of the uncommitted package-lock.json, active install docs and command references.
- Decision: Bun 1.4.3 (current stable registry release) becomes the package manager and script runner. Node 26 remains available for tools and the sanitized Node probe suite. Use bun install --frozen-lockfile and bun run --no-env-file check. Do not change historical backend lockfiles or instructions.
- Planned verification: migrate the root dependency graph, frozen Bun reinstall, aggregate local checks and both browser artifacts.

### One creator watch flow and Bun revision

- Date and owner: 2026-10-14, Codex.
- Item IDs: P5.1–P5.7 complete; Bun revision of P1.5/P1.6/P3.4/P3.5 complete.
- Files changed: runtime client, pipeline, message validation, YouTube watch adapter/controller and CSS, background/content entrypoints, minimal session sign-in UI, auth/pipeline/navigation regression tests, scripts/browser-watch.mjs; Bun packageManager/engines, bun.lock and active documentation. Root package-lock.json removed.
- Implementation: direct allowlisted first-party fetches; privileged storage.session account state; one renewal for 401/403 with logout race protection; IndexedDB-backed matching/cache; rocket button and blue/purple glow only for confirmed matches; navigation revision guards and observer ownership. Current live owner-handle and Shorts-canonical metadata forms verified through the in-app browser and used in adapter regression tests. Old table data/timestamps are not imported; modern freshness uses checkedAtMs/expiresAtMs exclusively.
- Verification: frozen Bun 1.4.3 install passed; bun run --no-env-file check passed lint/typecheck, 7 Node + 20 Vitest tests, both MV3 builds and artifact checks, followed by focused additions taking Vitest to 23 passing tests. Runtime-native fetch regression covered after real browser testing found an unbound receiver. Harness now starts each build acceptance from a fresh disposable profile to avoid restored old worker code.
- Account-backed browser acceptance: scripts/browser-watch.mjs chrome --live and firefox --live passed sequentially. Both signed in through privileged runtime messaging, recovered from a deliberately invalid bearer, confirmed ka8kT_YOtU0, rendered exactly one rocket with the correct canonical Nebula URL on the real YouTube watch page, showed no false button for 02eltxATsn4, logged out, restarted and returned the same persisted decision timestamp with no account session. No helper/table/backend requests exist in active code or permissions; full runtime network inspection is a Phase 7 check.
- Limitations: natural token expiry remains simulated via rejected bearer; the button destination was checked but click-through navigation will be included in final acceptance. Browsers are local headless development binaries, not manual stable-release UI sessions. No account output or screenshots persisted.
- Next action: P6.1–P6.7 claimed in progress, owner Codex; intended files extension/core/{browsing,scheduler,preferences,management}.ts, pipeline/background/content/UI updates and focused interruption/multi-tab/preference tests. Verify current home/search/subscriptions/channel/recommendation structures, add mappings only with explicit identity confirmation, persist bounded refresh leases/checkpoints/backoff and expose corrections/cache status.

### Browsing and recovery implementation

- Date and owner: 2026-10-14, Codex.
- Item IDs: P6.1–P6.7 in progress pending expanded browser acceptance; P7.1–P7.6 claimed in progress, owner Codex, for final integrated checks/documentation after Phase 6.
- Files changed: scheduler, browsing/YouTube adapters, YouTube public metadata resolver, management/preferences/settings UI, pipeline/content/background updates, second verified seed, browser-acceptance.mjs and focused tests.
- Implementation: two concurrent creator jobs, deduplication across tabs, IndexedDB leases/page checkpoints/generations and retry/backoff recovery via browser alarms; 5x100 episode limit with explicit incomplete-catalogue state; visible-card-only lookup; no account headers/cookies sent to YouTube oEmbed. Local settings migrate safe historical values and discard obsolete table/timestamps. Corrections and cache clearing broadcast invalidation to current tabs.
- Verification so far: 7 Node tests and 35 Vitest tests pass, covering interruption/lease resume, rate limits including explicit refresh, late writes after cache clearing, bounded pagination/concurrency, offline confirmed cache, creator identity, current card variants, lifecycle cleanup, preferences and correction/logout/cache effects. Bun check and both builds/artifact scans pass. Expanded Chromium live acceptance passed sign-in, public identity lookup, manual positive/negative corrections, cache clearing, real click-through, search/channel rockets, settings/local storage, logout and network audit (10 Nebula API requests, 7 public YouTube lookups, zero old lookup requests or misplaced authorization/cookie headers). Firefox passed the functional scenarios; its initial BiDi audit missed background requests, and a privileged background-page counter audit is in progress.
- Live DOM evidence: signed-in in-app subscriptions rendered 100 current yt-lockup-view-model cards with title/creator links; search uses ytd-video-renderer; channel/recommendations use lockup cards. Signed-in home rendered a grid with no cards in this account. No account names, subscription metadata, credentials or screenshots saved. The in-app browser cannot load unpacked extensions (only visibility/viewport capabilities), so this establishes current markup, not loaded-extension acceptance in that session.
- Additional contracts: public YouTube oEmbed verified for PXuQ5ZEBfTA with author handle @Wendoverproductions, and Nebula wendover creator ID fe4d9c1c-017b-494c-9afc-e79e6859b211 still matches the historical mapping. The first-party episode detail endpoint was verified for the seed video and enables manual corrections outside the bounded feed. Other historical mappings stay inactive.
- Manifest correction: Firefox minimum is now 140; data-transmission declarations identify authenticationInfo and browsingActivity rather than incorrectly claiming none. Only first-party service requests are used; no telemetry added. See Mozilla built-in consent documentation. Chrome remains minimum 120.
- Final acceptance work planned: fresh frozen Bun install, complete check, private-value/artifact scan, integrated browser/restart/recovery tests, inspect final staged diff and workflow/credential exclusions, local commit and accurate remaining browser gates. No pushes/publication/hosted CI.

### Accepted live-feed acceptance gap and final review

- Date and owner: 2026-10-14, Codex (integration owner).
- Item IDs: P6.1 and P7.2 remain partially verified; P6.2–P6.7 and P7.1/P7.3–P7.6 are in final review.
- User decision: when asked to sign into the separate Chrome for Testing and Firefox Nightly feed-test windows, the user selected “Leave this live acceptance gap documented”. Signed-in home/subscriptions extension acceptance is deferred by that explicit instruction. This exception changes the requested handoff scope; it does not turn an unperformed check into a pass or establish full phase acceptance.
- Evidence boundary: signed-in in-app browser inspection verified current subscription markup and an empty home grid. That browser cannot load Nebulate. Loaded-extension watch/search/channel checks passed in both development browsers; signed-in home/subscriptions remain unperformed. Recommendation adapters have fixture and live markup coverage, with full loaded-extension recommendation acceptance still unperformed.
- Cleanup: both interactive feed runners were interrupted; scoped process inspection found no surviving feed-test browser or geckodriver process. No Google cookies/profile contents were exported. Ignored disposable profiles are excluded from the handoff.
- Final files intended: artifact scanner (optional private-value comparisons without printing values, strict manifest/asset validation), active README/access documentation, this checklist and local commit. Planned verification: frozen Bun install, aggregate check, final watch/restart acceptance in both browsers, staged diff/credential/workflow/backend inspection. No additional interactive sign-in is requested.
- Review follow-up, P6.7: a rejected runtime message could leave the watch controller in checking until navigation. Claim `watch.ts`, the content message adapter and `watch.test.ts` for a bounded retry with navigation guards; verify a failed request recovers without navigation and cleanup cancels the retry. Expanded browser acceptance also checks visible recommendation cards and unexpected background request destinations.

### Final integrated verification and handoff

- Date and owner: 2026-10-14, Codex (integration owner).
- Item IDs: P6.2–P6.7 and P7.1/P7.3–P7.6 complete: 43 of 45 items checked. P6.1/P7.2 remain unchecked solely for the user-deferred signed-in home/subscriptions acceptance; full Phase 6/7 acceptance is not claimed.
- Files changed: modern extension source/entrypoints and retained artwork, root Bun/WXT/TypeScript/Vitest/Biome configuration and lockfile, sanitized tests/probes/browser harnesses/artifact scanner, active README and access/dependency evidence. Retired active Webpack/Jest/yarn source and copied public HTML/CSS/manifests removed; historical setup preserved separately. `backend/` and historical branch tips remain unchanged.
- Reproducible installation: moved the old `node_modules` aside, then `bun install --frozen-lockfile --cache-dir .local/bun-cache --no-env-file` installed 218 packages with Bun 1.4.3. The first sandboxed download attempt failed DNS; the network-enabled retry passed without lockfile changes. The superseded dependency directory was removed after verification. Node 26.8.2 remains the tool runtime. Bun install names the private environment file in its status output; no values are printed or embedded, and build wrappers disable environment exposure.
- Aggregate check: `bun run --no-env-file check` passed from the clean Bun installation: lint, strict type checking, 7 sanitized Node tests, 36 Vitest tests across 9 files, Chrome MV3 build, Firefox MV3 build and both artifact scans (14 files each). The scanner checks host/API permissions, browser minima/data declarations, local asset references, forbidden backend/sync/environment patterns, JWT-like constants and optional private environment values without printing values. Final watch-message retry and cleanup regression passed.
- Account-backed checks, run sequentially with `PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers"`: `node scripts/browser-watch.mjs chrome --live` and the Firefox variant both passed sign-in, rejected-bearer renewal, the known real match, exactly one correct rocket, no false rocket on the Day Pass promotion, logout and persisted match timestamp after restart. `node scripts/browser-acceptance.mjs chrome --live` and the Firefox variant both passed public identity lookup, manual positive correction, cache clearing preserving corrections/session, actual Nebula click-through, search/channel/recommendation cards, no duplicate/invalid recommendation links, local preferences, empty sync storage, manual exclusion/removal and logout.
- Runtime audit: final Chrome counters observed 14 Nebulate-worker HTTP requests (9 Nebula API and 5 public YouTube lookups); Firefox background counters observed 17 (9 API and 8 public lookups). Both reported zero unexpected background destinations, old lookup calls or misplaced authorization/cookie headers. Chrome audit isolates Nebulate's worker from YouTube's own service worker; Firefox uses a privileged background counter because BiDi omits those requests. Only counters/outcomes are recorded, never header values or private responses.
- Acceptance limits: signed-in home/subscriptions remain deferred by the user's explicit request. Current subscription markup has in-app and fixture coverage; the in-app browser cannot load the extension. The home grid was empty in that session. Manual stable-release UI acceptance was not performed; live automation used Chrome for Testing 156.0.8078.4 and Firefox Nightly 157.0. Natural expiry uses rejected-bearer recovery; rate limiting, offline periods and worker interruption use deterministic simulations rather than inducing service failures or waiting for natural expiry.
- Documentation and cleanup: README now covers installation, runtime sign-in, supported versions, settings/corrections, cache/logout effects, troubleshooting, commands and deferred acceptance. Relative documentation links resolve; `.env.example` contains only blank placeholders. Private environment files, binaries, profiles and outputs remain ignored; deferred feed profiles were removed. No helper, development watcher or browser test needs to remain running.
- Final review: staged names/diff and the root-only Bun lockfile inventory inspected; `git diff --cached --check` passed. A local staged-content audit checked 65 added/changed files for private development values, excluded generated/private paths, confirmed no backend/workflow changes and syntax-checked all 14 development/probe scripts. `.env.local` remains ignored/untracked. Historical refs remain at their original tips; only `modernize/local-extension` advances with the local implementation commit. Exact commit ID is reported in the handoff and Git history.
- Handoff: implementation and requested documentation are complete on `modernize/local-extension`; the user-deferred checks remain visible. Artifacts are `.output/chrome-mv3` and `.output/firefox-mv3`. The next acceptance item is P6.1/P7.2 only if the user later requests the signed-in feed run. No push, publication, signing, hosted CI or remote changes were performed.

### Follow-up: automatic creator fetching and missing Sam O'Nella

- Date and owner: 2026-10-14, Codex (sole integration owner).
- Item IDs: P6.1/P6.2/P6.3/P6.7 and P7.1/P7.5/P7.6; follow-up in progress. Existing user-deferred signed-in feed acceptance remains deferred.
- Report: Wendover appeared only after manual Refresh; Sam O'Nella is absent from the creator list. The current runtime has only two verified seed mappings and does not discover arbitrary creators. Investigate automatic fetch independently from missing mapping coverage.
- Files intended: relevant creator seed/storage and controller/pipeline modules after reproducing; focused regression tests; a fresh-profile public browser auto-fetch harness; README/access evidence and this work log. Historical backend files are read-only references.
- Planned verification: reproduce automatic browsing without prewarming through inspect/observe/refresh; verify current first-party Sam O'Nella identity before enabling it; test delayed dynamic pages and cache/scheduler interaction where relevant; run local checks/both builds and targeted loaded-browser auto-fetch checks. No new dependencies, account/profile export, remote mutation or signed-in feed request.
- Clarified user scope: include all current Nebula creators and available verified YouTube channel mappings, with video matching on demand rather than a precomputed global video index. Whenever a mapped creator is encountered, refresh its latest videos subject to a freshness interval and failure/rate-limit backoff, even when the encountered video has a cached match. Ship an updateable creator snapshot/registry and expose unmapped coverage; do not silently treat arbitrary same-name channels as verified.
- Additional files intended: creator directory/registry data and refresh logic, versioned storage migration, privileged directory update messages/status and settings controls; a locally invoked public registry update script. Preserve manual creator corrections when bundled or live directory data updates. The directory is metadata about creators, distinct from fetching every creator's video catalogue.
- Confirmed reproduction: the fresh-profile Chrome baseline fetched Wendover automatically without manual refresh or inspect/observe prewarming. Separately, the new cached-encounter regression against `HEAD` failed as expected: a still-fresh video decision prevented a creator fetch after the four-hour catalogue interval. The fixed pipeline passes that regression and keeps the cached match immediate while scheduling relevant creator work. Original browser/page circumstances were not provided, so identical reproduction of the user's first encounter is not claimed.
- Implementation in progress: complete bundled directory, verified mapping maintenance, searchable coverage/unmapped entries, additive mapping updates preserving manual reassignments, creator refresh independent of decision TTL, and completion invalidation of automatic negatives in open tabs. A channel's canonical owner metadata replaces RSS-only verification because Sam's valid channel returned RSS 404. The public directory has 383 entries over four pages; current identity proof confirms Sam O'Nella. Initial bulk public verification received 429, stopped, observed a five-minute backoff, and resumed with sequential throttling/cached results. Verification dates are retained with each mapping.
- Focused verification so far: 7 Node and 43 Vitest tests pass, including cached/manual encounter freshness, failure backoff, one completion notification, preserving manual/confirmed decisions, current channel owner/lockup parsing, complete-directory uniqueness and preserving manual creator reassignments on reopen. Strict type checking passes. P6.2/P6.3 are reopened for the expanded user scope until final registry/build/browser verification. No new dependency or storage-schema version is needed; creator records merge additively into the existing store.
- Additional reproduced trigger defect: continuous unrelated page mutations indefinitely postponed the original trailing scan timers after delayed metadata/cards arrived. Both watch and card regression tests failed with zero observations. `watch.ts` and `browsing.ts` now own one pending bounded scan instead of restarting the delay on each mutation, with timer cleanup on stop. Planned verification includes those red-to-green regressions plus loaded-browser automatic fetching without prewarming.
- Final implementation: app version 1.0.1 bundles the full 383-channel public directory and 212 verified YouTube mappings, including Sam O'Nella, Wendover and Not Just Bikes. All 171 unresolved entries remain searchable and clearly unverified; they include originals without a direct YouTube counterpart and creators needing further evidence. This does not claim every Nebula channel has a verified YouTube match. The maintenance candidate file contains 252 public historical references (including parent aliases); it is separate from the active verified registry. `update:creators` explicitly regenerates the directory/proofs for app updates, with sequential throttling, cached results, 429 backoff, duplicate rejection, verification dates and atomic publication. No hosted mapping service is introduced.
- Runtime behavior: every mapped-creator encounter checks catalogue freshness before using a video cache/manual decision. Cached decisions return immediately while due refreshes run. Successful completion invalidates automatic negative decisions for that creator and signals open YouTube tabs to recheck; positive and manual decisions remain intact. Existing four-hour freshness, bounded concurrency/pagination, persisted leases and failure backoff remain. Registry updates merge into the existing IndexedDB store, preserve manual mappings/reassignments and clear obsolete automatic identity decisions. Settings exposes directory counts, search, mapping preparation and existing refresh/backoff status.
- Local verification: `bun install --frozen-lockfile --cache-dir .local/bun-cache --no-env-file` passed with no lockfile/dependency changes. `bun run --no-env-file check` passed lint, strict TypeScript, 7 Node + 46 Vitest tests, both browser builds and both 14-file manifest/artifact scans. Follow-up lint/typecheck also passed after final maintenance-script refinements. Tests cover both reproduced trigger defects, new-publication rematching, backoff, manual-correction precedence, registry integrity and current channel/lockup parsing.
- Loaded-browser verification: `PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/browser-autofetch.mjs chrome --public` and the Firefox equivalent both passed from empty disposable profiles. Neither test clicks Refresh nor calls inspect/observe to prewarm data. Browsing real Wendover and Sam O'Nella channel pages automatically created/fetched their jobs; aging only the Wendover creator timestamp while retaining fresh confirmed decisions caused another automatic fetch on a later encounter. Both profiles closed and were removed. Checks used public metadata, with no account or exported cookies. The previous signed-in home/subscriptions acceptance waiver remains unchanged; account-backed acceptance was not rerun for this follow-up.
- Final review/handoff: source diff and generated public registry reviewed; no backend, historical branch, dependency or workflow changes. Active docs explain the app-update mapping workflow and automatic encounter freshness. Only local source/data/docs and a local commit are part of this follow-up. Reload the extension and existing YouTube tabs to activate the rebuilt 1.0.1 artifacts; uncertain mappings remain unresolved pending verification/manual correction.
