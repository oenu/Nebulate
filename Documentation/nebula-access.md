# Nebula access evidence

## Scope and first-party verification

Checked 2026-10-14. The HTTPS page at [nebula.tv](https://nebula.tv/) returned 200 without a redirect and referenced `/static/index-DY6HnEGf.js`. That first-party asset names `https://users.api.nebula.app/api/v1/` and `https://content.api.nebula.app/` as its API bases, the `auth/login/`, `auth/logout/`, and `authorization/` routes, and video channel/episode routes. Its website login uses a same-origin relay; the direct users API also accepts the scoped development probe.

Credential-free GET checks on the three users routes returned 405 with `Allow: POST, OPTIONS`, without redirects. The creator route returned 200 without a redirect. All probe fetches reject redirects, omit browser cookies, and constrain destinations before constructing authentication headers. The probe sends JSON email/password only to the exact first-party login URL. Raw authentication responses, tokens and private error payloads are never printed or saved.

| Operation | Method and destination | Contract |
| --- | --- | --- |
| Login | POST `https://users.api.nebula.app/api/v1/auth/login/` | JSON `email`, `password`; response `key` kept in memory |
| Authorize / renew | POST `https://users.api.nebula.app/api/v1/authorization/` | `Token` key; response bearer token kept in memory |
| Logout | POST `https://users.api.nebula.app/api/v1/auth/logout/` | `Token` key; subsequent authorize rejected with 401 |
| Creator | GET `https://content.api.nebula.app/video_channels/notjustbikes/` | `video_channel` with string ID, slug, title |
| Episodes | GET creator route plus `video_episodes/?page_size=2` | `results`, nullable `next`/`previous`; next uses offset pagination |
| Episode detail | GET `https://content.api.nebula.app/video_episodes/<slug>/` | Validated public episode; manual correction checks primary creator |

For browsing cards without creator links, the background uses the fixed public YouTube `https://www.youtube.com/oembed` endpoint with a validated 11-character video ID. It omits cookies/authorization and validates `author_url` as a YouTube channel or handle. Explicit creator mappings also compare the public channel RSS feed and oEmbed author identity. No arbitrary page URL can become an authenticated destination.

Public metadata is currently readable without an account. Invalid bearer tokens receive 403 rather than the 401 assumed by older clients. Authentication recovery must renew once for either response and then surface a continued failure; it must not loop.

## Fixture contract and seed

`test/nebula/fixtures/notjustbikes.json` contains public, allowlisted creator/episode fields, fetched 2026-10-14. Episode fields are ID, slug, title, primary channel ID/slug, publication date, duration in seconds, and the canonical HTTPS `https://nebula.tv/videos/<slug>/` share URL. Other fields are discarded. Creator feeds include cross-promotions: two of the four returned episodes have Day Pass as their primary channel. Feed membership alone must never establish creator identity.

The seed is Not Just Bikes: Nebula `video_channel:8714203d-6950-4536-be0b-78196a599cf6`, slug `notjustbikes`, YouTube `UC0intLFzLaudFG-xAvUEO-A`. The public [YouTube channel feed](https://www.youtube.com/feeds/videos.xml?channel_id=UC0intLFzLaudFG-xAvUEO-A) verifies this channel and the exact title of video `ka8kT_YOtU0`, “Cycling Made Difficult (but it's getting better!)”, matching the fixture's Nebula episode. Its Day Pass teasers are useful conservative no-auto-match examples because the Nebula primary channel differs. Deterministic unknown-title examples are explicitly synthetic, not claims that a live video has no Nebula equivalent.

The second verified seed is Wendover Productions: YouTube `UC9RM-iSvTu1uPJb8X5yp3EQ` / `@Wendoverproductions`, Nebula `video_channel:fe4d9c1c-017b-494c-9afc-e79e6859b211` / `wendover`. The public feed/oEmbed author for `PXuQ5ZEBfTA` and the current Nebula creator response confirmed the historical mapping on 2026-10-14. Other historical mappings are not imported automatically.

The follow-up creator registry replaces the two-creator limit. The current public `https://content.api.nebula.app/video_channels/?page_size=100` directory returns 383 channels across four offset pages, including 351 default channels and 32 episodic/film channels. The bundled `extension/core/creators.json` includes every directory entry, plus mapping evidence and verification dates where established. `scripts/data/creator-candidates.json` preserves public historical IDs as maintenance candidates; they are never activated without verification. The updater checks current Nebula ID/slug and canonical YouTube owner identity, or a direct first-party Nebula website link; new guessed-handle discoveries additionally require two primary-creator title matches and matching oEmbed authors. Duplicate YouTube channel identities are left unresolved.

Sam O'Nella is verified as Nebula `video_channel:8ef93396-3e34-47b7-a0a4-5f94ea322ce0` / `samonella`, YouTube `UC1DTYW241WD64ah5BFWn4JA` / `@SamONellaAcademy`. His YouTube RSS returned 404 while the actual channel page returned 200 with matching canonical owner metadata. Manual creator verification therefore reads the channel's own metadata renderer as JSON data, without executing site scripts or relying on feed availability. Unrelated recommendation channel IDs are ignored. HTTP-form canonical handles in that public metadata are normalized only as identities; all actual requests remain HTTPS.

Run `bun run --no-env-file update:creators` explicitly before an app update to regenerate the public directory and verified mappings. The maintenance script is credential-free, sequentially throttled, caches public verification results in ignored `.local/` files and stops with a persisted retry time on HTTP 429. It publishes the snapshot atomically. The completed 2026-10-14 pass contains all 383 directory entries and 212 verified mappings; 171 entries remain explicitly unmapped, including originals without a direct YouTube counterpart and creators needing further identity evidence. Ordinary builds/tests use the bundled snapshot. Runtime catalogue requests remain limited to creators encountered while browsing; a cached video decision does not suppress the creator freshness check.

## Local probe commands

No application toolchain is needed for the Node probe; use Node 26.8.2 or a compatible modern Node with `util.parseEnv`.

```sh
node --test test/nebula/api.test.mjs
node scripts/nebula/probe.mjs --public
node scripts/nebula/probe.mjs --live
node scripts/nebula/build-extension.mjs
```

`--live` explicitly reads `.env.local` as data, using `NEBULA_USERNAME`/`NEBULA_PASSWORD` (or the existing private file's legacy key names). Do not source it. `--write-fixtures` writes only the public metadata allowlist. Ordinary tests never need this file or an account.

The disposable MV3 probes are built under ignored `probes/nebula-extension/chrome/` and `firefox/`. Load those directories as temporary/unpacked extensions and open `probe.html`, or use the isolated development runner:

```sh
bun install --frozen-lockfile
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" bunx --no-env-file playwright install chromium firefox
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/nebula/browser-probe.mjs chrome --public
PLAYWRIGHT_BROWSERS_PATH="$PWD/.local/browsers" node scripts/nebula/browser-probe.mjs firefox --public
# Explicit account-backed variants use --live.
```

The runner enables privileged WebDriver access only in its disposable Firefox profile, keeps macOS app data under `.local/`, and uses no tracing, screenshots or request logging. Its installed extensions have only storage and the two API host permissions, plus a YouTube content-script match to test session-storage isolation. Local tools, browsers, profiles and downloaded website assets stay ignored.

## Observed versus simulated

The Node account probe observed login, authorization, two catalogue pages (four episodes), token reissue, missing creator 404, logout and revoked-key 401. The rejected-bearer test deliberately uses an invalid token and then renews; it does not wait for natural token expiry. Rate-limit 429, Retry-After and redirect/error behaviour are deterministic sanitized tests; no rate limit was deliberately induced against the service. Browser-specific outcomes and the feasibility decision are recorded in the plan work log.

Use runtime sign-in from an extension page, with passwords held only long enough to submit. Keep key/token in privileged `storage.session`, so worker suspension preserves the session but browser restart requires sign-in. Chrome explicitly sets `TRUSTED_CONTEXTS`; Firefox's session API denies content-script access by default. Do not fall back to `storage.local` for account secrets. [Chrome storage reference](https://developer.chrome.com/docs/extensions/reference/api/storage), [Firefox session storage reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/session).
