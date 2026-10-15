# Nebulate agent instructions

## Start here

Read [Documentation/modernization-plan.md](Documentation/modernization-plan.md) before implementation. It contains the accepted design, ordered work, acceptance criteria, and the shared checklist. Update it as work progresses.

Work on `modernize/local-extension`, initially based on `965c2d2` from `origin/firefox-quereySelector-compatibility`. Check branch and working-tree status before editing. Preserve unrelated user changes. Do not modify, reset, merge into, or rewrite the historical branches. Keep the historical backend as reference; exclude it from the modern application's dependency installation and checks.

## Scope and authority

- The shipped application must run entirely inside the browser extension. Development tools may run locally; a running Node helper, database server, or hosted lookup service must not be required by users.
- All checks run locally. Do not add or trigger GitHub Actions, hosted CI, publication, signing, or deployment workflows.
- Do not push branches or change remote repository settings without a new explicit instruction. Removing workflows on this branch does not disable workflows on historical branches or in GitHub settings.
- Use the latest stable releases of every retained direct dependency when implementing upgrades, including major-version migrations. Resolve versions from the package registry, commit a lockfile, check peer/runtime requirements, and record any unresolved incompatibility. Do not force incompatible transitive versions merely to make every package number newest.
- Keep React and Mantine initially; use WXT and TypeScript for the modern extension, with explicit Chrome and Firefox Manifest V3 targets. Validate Nebula browser access before broad migration.
- Preserve the existing visual identity for the first working creator. Broad visual redesign is outside the first milestone.

## Readability and comments

- Keep code readable, with descriptive names, consistent formatting, and small functions that have a clear purpose. Avoid compressed statements and deeply nested expressions when named intermediate values make the flow easier to follow.
- Add comments explaining non-obvious intent, constraints, and invariants, especially identity verification, cache freshness, backoff, worker recovery, and browser lifecycle handling. Keep comments accurate as code changes; avoid narrating obvious statements.
- Prefer straightforward control flow and existing project patterns over clever abstractions. Apply these conventions to development scripts and tests as well as shipped extension code.

## Credentials and local data

- `.env` and `.env.*` are private, ignored files; `.env.example` contains placeholders only. Never stage private environment files with `git add -f`.
- Do not print credentials, tokens, request authorization headers, authentication responses, or raw error objects that might contain them. Do not copy them into fixtures, artifacts, documentation, screenshots, or commits.
- Local development probes may load credentials programmatically from `.env.local` and send them only to verified Nebula authentication endpoints over HTTPS. Verify endpoint ownership and redirect handling before sending credentials. Do not execute the environment file as a shell script.
- Never expose credentials using `VITE_*`, `WXT_*`, build-time replacement, or imported environment files in extension code. The extension must have its own runtime sign-in mechanism.
- Keep authentication state in the extension's privileged context, with minimal persistence and explicit logout. Do not sync credentials or tokens, or expose them to YouTube content scripts. Verify storage access controls for both browsers; browser storage is not a password vault.
- Ordinary local checks must use sanitized fixtures and require no live account. Keep account-backed probes and browser tests separate and explicitly invoked.

## Checklist workflow

1. Read the phase dependencies and the work log. Choose an unchecked item whose prerequisites are met.
2. Record the item IDs, owner, status, intended files, and verification before editing. One owner per item. Do not assume this file itself authorizes spawning agents; follow the current session's delegation instructions.
3. Keep changes narrow. If multiple agents are explicitly assigned, agree on file ownership and designate one integration owner to reconcile shared files, manifests, lockfiles, and the checklist. Do not switch the shared checkout under another worker.
4. Run checks appropriate to the change. Check a box only when its actual completion criteria are met; document exact commands and results. A build is not evidence of live browser acceptance.
5. Leave blocked or partially completed items unchecked. Record the concrete blocker, completed work, and next action. Never mark work complete because it was delegated or attempted.
6. Update the work log and relevant checklist in the same change as implementation. Include affected files, verification, and remaining gaps in the handoff.

## Verification and commits

The commands in the plan are targets until implemented. Do not claim that `check`, browser builds, or live probes exist merely because they appear in the document. At initial handoff, the modern toolchain is not installed and no application tests have been run.

Use focused tests for matching, caching, authentication recovery, worker interruption, and observer lifecycle. Run local checks once they exist; keep authenticated live checks distinct. Verify both browser artifacts and explicitly report browser acceptance that was not performed.

Before committing, inspect the staged file names and diff, check ignored credentials remain untracked, and use explicit paths when staging. Never commit logs, local browser profiles, or generated credential-bearing files. Report the branch, commit, checks performed, and outstanding work accurately.
