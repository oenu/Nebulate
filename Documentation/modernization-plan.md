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
- [ ] P1.5 Establish the modern project layout, one active package manager/lockfile, supported runtime requirements, and install instructions. Keep `backend/` as an inactive reference, outside active installation and checks.
- [ ] P1.6 Add the local commands described below as the toolchain becomes available. Document which require installed browsers and which require a live account.

Acceptance: the modernization branch is isolated, credentials are excluded, and a contributor can install and check the active extension locally without GitHub Actions. P1.5 and P1.6 may finish during Phase 3 after the Phase 2 feasibility gate.

## Phase 2 Validate current Nebula access

Dependencies: P1.1 through P1.4. Use a minimal disposable or narrowly scoped probe before the broad toolchain migration.

- [ ] P2.1 Identify and verify the current Nebula authentication and catalogue endpoints, redirects, request formats, and required permissions. Treat the 2022 endpoint assumptions as unverified.
- [ ] P2.2 Implement a local development probe that loads `.env.local` programmatically. Redact all sensitive request/response data and constrain credential submission to verified Nebula authentication endpoints.
- [ ] P2.3 Verify login, token expiry/renewal, logout behaviour, creator lookup, video pagination, unavailable metadata, and rate-limit responses. Document what is observed and what remains simulated.
- [ ] P2.4 Verify catalogue requests from unpacked Chrome and Firefox extensions with minimal host permissions. A successful Node probe alone is insufficient.
- [ ] P2.5 Choose the runtime sign-in mechanism based on those results. Keep passwords out of persistence; minimize token storage, restrict access to privileged contexts, clear it on logout, and verify browser-specific behaviour.
- [ ] P2.6 Select one creator and known matching/unmatched examples. Save sanitized metadata fixtures and document the verified response contract.
- [ ] P2.7 Record the feasibility decision. If browser authentication or catalogue access is blocked, describe the blocker and extension-only alternatives before proceeding with architecture that depends on it.

Acceptance: the extension retrieves one creator's current metadata and recovers from an expired session in both target browsers. Any simulated or unverified part is explicit. No remote proxy or local runtime helper is introduced.

## Phase 3 Modernize packages and builds

Dependencies: Phase 2 feasibility decision. Complete P1.5 and P1.6 here.

- [ ] P3.1 Inventory retained, replaced, and removed dependencies. Resolve current stable releases from the registry and record the resolution date, package versions, and runtime/peer requirements.
- [ ] P3.2 Migrate duplicated Webpack configurations to WXT with explicit Chrome and Firefox Manifest V3 targets. Preserve required assets and extension identity where compatible.
- [ ] P3.3 Upgrade TypeScript, React, React DOM, Mantine, icons, browser APIs/types, and all other retained direct dependencies. Perform required API/CSS migrations; remove obsolete packages and unnecessary type packages.
- [ ] P3.4 Introduce Vitest and current lint/format tooling. Commit the chosen lockfile and document a reproducible frozen-lockfile install. Do not install the legacy backend as part of it.
- [ ] P3.5 Implement local lint, typecheck, test, browser build, and aggregate check commands. Keep live probes separate. Remove obsolete scripts referencing old paths, signing, or the hosted backend from the active workflow.
- [ ] P3.6 Build and load both browser targets, checking manifests, permissions, popup/options rendering, and background startup. Record any latest-version compatibility exception and its resolution plan.

Acceptance: a clean local install produces working Chrome and Firefox extension shells, with type checking, linting, and initial tests passing. The active dependency set uses current stable direct releases or explicitly documented unresolved exceptions.

## Phase 4 Implement local storage and matching

Dependencies: Phase 2 metadata contract and Phase 3 toolchain.

- [ ] P4.1 Define typed creator mappings, Nebula metadata, YouTube observations, match decisions, manual overrides, cache timestamps, and refresh checkpoints. Validate external responses at the boundary.
- [ ] P4.2 Implement versioned IndexedDB storage with indexes for direct video/creator lookup, migrations, bounded retention, and atomic updates. Keep preferences local and account state separate.
- [ ] P4.3 Extract matching into pure TypeScript functions, independent of Mongoose. Prioritize explicit links and confirmed creator identity; handle score zero correctly. Use conservative title matching with available supporting metadata and ambiguity thresholds.
- [ ] P4.4 Represent unknown, checking, confirmed, ambiguous, no-match, and retryable-error states distinctly. Expire negative results so later Nebula releases can be found. Account for publication delays and edited titles.
- [ ] P4.5 Support manual confirmations and corrections that survive refreshes; prevent one video being silently reassigned to a conflicting match.
- [ ] P4.6 Test exact/near matches, unrelated creators, duplicate titles, ambiguous candidates, publication delays, score-zero handling, corrections, expiry, and migrations using sanitized fixtures.

Acceptance: deterministic local tests establish matching and cache behaviour without a live account or database server. Uncertain or failed requests never become confirmed redirects or permanent negative results.

## Phase 5 Deliver one creator end to end

Dependencies: Phases 2 through 4. Keep scope to one creator and the watch page initially.

- [ ] P5.1 Read video ID, title, and creator identity from the current YouTube page through a replaceable page adapter. Handle initial page load and same-tab navigation.
- [ ] P5.2 Connect observations to the privileged background request/matching pipeline. Validate message payloads and permitted request destinations; never allow page messages to request arbitrary authenticated URLs.
- [ ] P5.3 Display the existing watch button/highlight only for confirmed matches. Reuse the visual identity, remove stale state on navigation, and verify the destination URL.
- [ ] P5.4 Fix observer ownership and cleanup so each page lifecycle owns its observers and event handlers. Prevent duplicate buttons and callbacks after repeated navigation.
- [ ] P5.5 Use consistent refresh timestamps and explicit time units. Replace the `lastUpdate`/`lastUpdated` inconsistency with a tested freshness contract; migrate retained data where applicable.
- [ ] P5.6 Test the watch-page flow with sanitized fixtures, including delayed responses arriving after navigation, unmatched videos, and expired sessions.
- [ ] P5.7 Verify the real creator in Chrome and Firefox: correct redirect, no false button on an unmatched video, cache persistence after browser restart, and no old lookup-table/backend requests.

Acceptance: one creator works entirely inside both browser extensions. Record the exact live scenarios and outcomes. The backend and hosted table can remain unavailable throughout this acceptance run.

## Phase 6 Expand browsing and recovery

Dependencies: Phase 5 acceptance.

- [ ] P6.1 Extend page adapters to home, search, subscriptions, channel pages, and recommendations. Verify current page structures and navigation; do not assume the 2022 selectors remain correct.
- [ ] P6.2 Expand creator mappings from the verified seed. Validate historical mappings before use, provide a correction path, and keep unknown creators unresolved until identity is established.
- [ ] P6.3 Fetch only relevant creators, deduplicate requests across tabs, bound concurrency, and use timeouts, pagination limits, cancellation, and rate-limit backoff.
- [ ] P6.4 Persist refresh checkpoints and retry state. Recover from worker termination and browser restart without relying on process-global state or indefinite timers. Do not let concurrent jobs overwrite newer results.
- [ ] P6.5 Add popup/options controls for sign-in status, refresh status, cache management, and manual corrections. Clearly distinguish checking, no match, unavailable metadata, and sign-in required.
- [ ] P6.6 Verify local preferences and useful existing settings migrate safely. Cache clearing and logout must have explicit, tested effects on metadata, overrides, and authentication.
- [ ] P6.7 Test multi-tab requests, repeated navigation, offline periods, rate limits, stale responses, interrupted refreshes, and session recovery. Keep confirmed cached matches usable when fresh metadata is unavailable.

Acceptance: normal browsing across all supported surfaces remains responsive, creates no duplicate observers/buttons, and recovers without a helper service or full-catalogue scrape.

## Phase 7 Complete local acceptance and documentation

Dependencies: Phase 6. Add focused regression tests during earlier phases rather than deferring all testing here.

- [ ] P7.1 Run the aggregate local check from a reproducible installation: lint, type checking, deterministic tests, Chrome build, Firefox build, and manifest/package validation. No live credentials are needed.
- [ ] P7.2 Run explicit account-backed acceptance separately in Chrome and Firefox. Cover login/logout, renewal, real matches, unmatched videos, each browsing surface, restart persistence, and recovery.
- [ ] P7.3 Inspect generated artifacts for environment files, embedded credentials/tokens, unnecessary permissions, and old lookup-table/backend URLs. The scanner must report file locations/results without printing secret values.
- [ ] P7.4 Confirm runtime network activity is limited to the intended service requests and contains no calls to the old lookup service. Confirm metadata/preferences remain local and no account data enters browser sync.
- [ ] P7.5 Document installation, runtime sign-in, local commands, cache/override behaviour, troubleshooting, supported browser versions, and remaining acceptance limitations. Historical setup instructions must be clearly distinguished.
- [ ] P7.6 Review the final diff and active dependency inventory, verify no GitHub Actions workflows were reintroduced, and prepare a local handoff with branch, commit, checks, and outstanding work. Do not publish or push.

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
