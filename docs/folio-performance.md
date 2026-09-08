# Folio: local-first rendering and sync

The editor restores local notes and renders immediately. Handwriting refinement and account sync run afterward. Both `public/folio.html` and `public/folio/index.html` use the same renderer.

## Rendering changes

- Keep handwritten image definitions in a persistent SVG asset bank outside the changing preview. PNG, print and standalone exports retain their own assets.
- Cache pagination per record, invalidate it for changed text, section typography or page geometry, and cache system-font measurements.
- Keep the live SVG and editable text-box elements mounted. Reuse unchanged section controls and preserve the cursor during edits.
- Rebuild page-selection options only when their labels change; inspect unique characters when checking missing handwriting samples.
- Open the editor before decoding/recoloring handwriting. Yield between image-processing tasks and avoid unused accent/white tint generation.
- Load letter effects, video and admin screens on demand rather than with the Folio app shell.

## Measurements from this development session

These are individual local-browser samples, not cross-device benchmarks or end-to-end interaction latency percentiles. `data-last-render-ms` measures the synchronous layout/render function, not the later browser paint.

| Measurement | Before the final optimization pass | After |
| --- | ---: | ---: |
| Pilocarpine live-preview HTML | 740,167 characters | 138,769 characters |
| Pilocarpine entry-switch render sample | 20.1 ms | 15.1 ms |
| Continuous typing, temporary short note | Active editor was recreated | Same editor retained; final character render 4.7 ms |
| Main production JS chunk, uncompressed | 914.03 KB | 361.66 KB |
| Main production JS chunk, gzip | 280.67 KB | 141.54 KB |

The bundle numbers exclude shared vendor, animation and Supabase chunks. Code was deferred, not removed from other experiences.

## Sync contract

`public/folio-sync.js` saves an account-scoped local envelope containing the project, pending mutation and server revision. It coalesces edits, retries after reconnect, recovers lost upload acknowledgements, and requires a choice when another device has a newer revision. Browser recovery copies can be downloaded. Different signed-in accounts use different keys. Cloud refresh waits while a text input is focused.

The hidden `folio-sync.html` bridge uses the existing Supabase session. It verifies message origin, source and account, pins the request's bearer token to the validated session, and times out requests. Credentials are not sent to the editor. Downloaded HTML embeds the sync runtime but remains local-only when opened as a file.

Migration `20260909000000_folio_notebook_sync.sql` was applied to the linked monthsarry project. The table uses owner RLS; the save RPC uses revisions and mutation IDs. An authenticated transaction verified insert/update, replay idempotency, stale-write conflicts, cross-account read/write denial, anonymous denial and invalid payload rejection. All synthetic database fixtures were rolled back; the final dry run was empty.

## Verification and limits

- Node/JSDOM Folio suites: rendering, glyph references, local-first startup, stable editing, section formatting, print, persistence, retries, conflicts, account isolation and portable runtime.
- Vitest: sync bridge and FolioExperience wrapper.
- TypeScript and production build; scoped lint and diff whitespace checks.
- The local standalone renderer was inspected and typed into in the in-app browser. The `?view=folio` wrapper required sign-in, so a complete signed-in browser-to-cloud round trip was not exercised.
- The browser tool could not accept the native confirmation while removing its temporary `New drug` / `Speed check` note. That synthetic note remains only in the test browser's local guest notebook; it was not uploaded to Supabase.
- Application deployment was not performed. Existing concurrent inline-editor and section-formatting work was preserved.
