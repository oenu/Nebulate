# Nebulate

Nebulate finds confirmed Nebula videos while you browse YouTube. The Chrome/Firefox Manifest V3 extension fetches metadata, matches videos and stores results inside your browser. It preserves the rocket button and blue/purple highlighting. No Node helper, database, hosted lookup table or backend is required at runtime.

The [modernization plan](Documentation/modernization-plan.md) records evidence and remaining acceptance gaps; contributors must read [AGENTS.md](AGENTS.md). The [historical release instructions](Documentation/historical-setup.md) describe the retired application.

## Install and use

Build locally using the commands below, then load `.output/chrome-mv3` with **Load unpacked** on Chrome's extensions page. In Firefox's `about:debugging` → **This Firefox** → **Load Temporary Add-on**, select `.output/firefox-mv3/manifest.json`. Firefox temporary installation must be repeated after restart. No signed or store-distributed package is produced.

The manifest targets Chrome 120+ and Firefox 140+. Automated live checks used Chrome for Testing 156.0.8078.4 and Firefox Nightly 157.0; manual stable-release browser acceptance was not performed.

Open Nebulate's popup or settings for optional Nebula sign-in. Public catalogue metadata currently works without an account; Nebula playback still follows Nebula's own access rules. Passwords are submitted directly to Nebula and never saved. Session keys/tokens stay in privileged `storage.session`, unavailable to YouTube content scripts, and disappear on browser restart. Sign out clears the local session immediately and attempts server revocation; an offline revocation failure is reported.

Browse a YouTube watch page, search, channel videos, home/subscriptions or recommendations. A rocket appears only for a confirmed match and opens its canonical Nebula video URL. Unknown or ambiguous videos receive no redirect. The extension bundles the complete current Nebula creator directory and verified YouTube mappings, including Sam O'Nella, Not Just Bikes and Wendover. Settings shows coverage and lets you search all creators. Unmapped entries require identity confirmation; some Nebula originals have no YouTube counterpart. Home/subscriptions acceptance limitations are listed below.

Settings include appearance preferences, creator refresh progress/backoff, cached match counts, manual video confirmations/exclusions and creator mappings. To correct a video, enter its YouTube watch URL or ID, inspect candidates, then save a canonical Nebula URL or a manual exclusion. Positive corrections must belong to the verified creator. Creator mapping changes require your confirmation and validate the public YouTube identity and Nebula channel.

Metadata, decisions, creator mappings, corrections and preferences stay on this device; nothing is written to browser sync. Clearing the cache removes catalogue videos, automatic decisions and refresh jobs while retaining mappings, preferences, corrections and sign-in. Select **Also remove manual video corrections** to erase corrections too. Logout retains the cache and settings. Automatic decisions expire (negative matches after 15 minutes, confirmed matches after seven days); matching cached confirmations remain usable offline. Retention bounds automatic decisions to 2,000/90 days and catalogue metadata to 5,000 records, preserving videos referenced by corrections.

## Troubleshooting

- No rocket: check the recent state and creator mapping in settings. Unverified identity, ambiguous titles, an incomplete catalogue or unavailable metadata remain unresolved. A creator refresh reads at most five pages of 100 episodes, so older videos may need a manual correction.
- Checking or unavailable: the extension fetches only relevant creators, limits concurrent work and honors retry backoff. Reconnect and retry after the displayed time. Interrupted jobs resume from local checkpoints through browser alarms. A forced refresh also respects service backoff.
- Sign-in required: sign in again after a browser restart or rejected session. Passwords are never recovered from local storage. Public metadata may still work while signed out.
- Background unavailable after updating an unpacked build: reload the extension, then reload the YouTube tab. Firefox temporary add-ons need to be reloaded after restart.

Whenever you encounter a mapped creator's videos, Nebulate checks whether their catalogue needs updating, including when the video already has a cached match or manual correction. Cached matches display immediately while refresh work proceeds. Successful catalogue fetches are reused for four hours; automatic negative decisions can request a fresh check after 15 minutes. Rate limits and failed requests respect persisted backoff. A completed refresh prompts open YouTube tabs to recheck automatic negatives; confirmations and manual corrections remain intact.

Creator/channel mappings ship with app updates. To regenerate the public directory and verify mappings before building a new app version, run `bun run --no-env-file update:creators`, then run `check` and reload the extension. This explicitly invoked development task reads public Nebula/YouTube metadata, uses sequential throttled requests and stores resumable public verification results under ignored `.local/`. On a rate limit it saves completed verified coverage, reports the retry time and waits for a later invocation; it does not guess or activate uncertain mappings. Historical IDs are candidates only, checked against current stable IDs and channel identity. New discoveries require a first-party creator link or matching channel identity plus two primary-creator video titles and YouTube authorship checks. The generated `extension/core/creators.json` records verification evidence/dates. Ordinary builds/tests use that bundled snapshot and make no live registry requests.

## Local development

Use Bun 1.4.3+ and Node 26+ (verified Node 26.8.2). Bun manages dependencies and runs scripts; the toolchain and Node fixture suite retain Node. From the repository root:

```sh
bun install --frozen-lockfile
bun run --no-env-file check
```

The root `bun.lock` is the sole active lockfile. `backend/` is inactive reference source and is never installed or checked by these commands. The [dependency inventory](Documentation/dependencies.md) records registry-resolved stable versions and migration decisions.

`bun run --no-env-file lint`, `bun run --no-env-file typecheck`, `bun run --no-env-file test`, `bun run --no-env-file build:chrome`, and `bun run --no-env-file build:firefox` work separately. `check` runs all of them and validates the generated manifests, asset references and runtime artifacts. They use sanitized fixtures and need no account or installed browser. Builds run WXT from an empty environment directory; Vite public environment exposure is disabled.

Development variants are `bun run --no-env-file dev:chrome` and `bun run --no-env-file dev:firefox`; install the chosen browser locally for these. All checks run locally. No signing, store upload, hosted CI or publication is configured.

## Explicit live checks

Read [Nebula access evidence](Documentation/nebula-access.md) before running `bun run --no-env-file probe:nebula`. That command explicitly reads the ignored `.env.local` and tests account access, with sanitized output and logout. Copy `.env.example` for placeholder names; never source environment files or expose account values with a public build prefix. The extension uses its own runtime sign-in, separate from development probes.

Local browser automation additionally needs development binaries:

```sh
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" bunx --no-env-file playwright install chromium firefox
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/browser-shell.mjs chrome
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/browser-shell.mjs firefox
```

The Firefox harness also obtains geckodriver and uses isolated macOS app data under `.local/` to work around the upstream development-browser startup issue. Browser binaries, profiles and generated artifacts are ignored; no browser traces, account responses or screenshots are captured by acceptance scripts.

Explicit account-backed tests read `.env.local` only when invoked with `--live`. Run each target sequentially; replace `chrome` with `firefox` for the other build:

```sh
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/browser-watch.mjs chrome --live
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/browser-acceptance.mjs chrome --live
```

The watch test checks rejected-bearer renewal, a real match, an unmatched promotion, one correct watch button, logout and restart persistence. Expanded acceptance checks real click-through, search/channel/recommendation cards, corrections, cache controls, local preferences and runtime request counters without logging account data. Network inspection found first-party Nebula API and public YouTube lookups, with no unexpected background destinations, old lookup requests or misplaced authorization/cookie headers. Natural token expiry, rate limits, offline recovery and worker interruption use deterministic simulations where noted in the plan.

For the automatic creator-fetch path, run `PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/browser-autofetch.mjs chrome --public` (and `firefox`). These start from empty profiles and browse real Wendover/Sam O'Nella channel pages without inspect/observe prewarming or pressing Refresh, then age a creator timestamp while leaving video decisions fresh to check a new automatic fetch.

**Remaining acceptance:** loaded-extension checks on signed-in YouTube home/subscriptions and manual stable-release browser UI acceptance were not performed. Signed-in in-app inspection verified subscription card markup and an empty home grid, but that browser cannot load Nebulate. The user explicitly requested that the signed-in feed gap remain documented. P6.1/P7.2 stay unchecked; full phase acceptance is not claimed.

For a future explicitly requested signed-in feed run, `scripts/browser-feed-acceptance.mjs chrome --live --interactive` (and `firefox`) opens a disposable headed browser for Google sign-in. This is separate from ordinary checks and was stopped when the user deferred the check. See the plan work log for exact performed scenarios and limitations.
