# Modern rebuild

## Outcome

German, local-only time tracker. React + TypeScript + Vite. Original Angular sources and Cordova wrapper retained; original npm manifest, lockfile, and README archived in `legacy/`. No legacy server contact, account system, or publishing.

## Assignments

| Task | Owner / requested role | Write ownership | Status / checks |
| --- | --- | --- | --- |
| Legacy audit | legacy_audit / harness_fast (Luna low) | Read only | Done; clock, booking, profile, export flows mapped; PHP backend absent; legacy deletion bug identified |
| Domain and persistence | data_layer / harness_worker (Terra medium) | modern/src/domain.ts, storage.ts, their test files | Done; 17 domain/storage tests pass |
| Profile and reports | support_views / harness_worker (Terra medium) | modern/src/ProfileView.tsx, ReportsView.tsx, support.css | Done; integrated and browser checked |
| Integration and experience | Main | Scaffold, App, styles, browser tests, documentation | Done; build and desktop/mobile journeys verified |
| Data-loss review | correctness_review / harness_review (Terra medium) | Read only: App, domain, storage | Three findings resolved: future entries, atomic tab writes, stale editor conflicts |

## Acceptance

- Clock in, pause, resume, clock out; preserve timer after reload.
- Create/edit/delete one booking; reject invalid/overlapping times.
- Date/reason/search filters and totals reflect actual records.
- Reports export CSV and printable PDF, profile and theme persist.
- Backup import is validated and confirmed before replacing data.
- Legacy browser storage migrates only when available on the same origin, without deleting originals.
- Desktop and mobile interactions; keyboard dialog focus; no browser errors.
- Production build, meaningful domain tests, browser scenarios.

## Boundaries

- Browser storage is per device/browser/origin, not cloud sync. Export backups for portability.
- Old PHP login, server data, NFC and GPS integration are not included in local mode.
- CSV replaces old XLS export. Print dialog supports save as PDF.
- Completed shifts are attributed to their start date in reporting.

## Verification evidence - 2026-11-05

Runtime: Node 24.10.0. React 19.3.1, TypeScript 7.0.2, Vite 8.3.6. All dependencies pinned in package-lock.json. No vulnerabilities reported by npm during lockfile generation.

| Check | Observed result |
| --- | --- |
| `npm run build` | Type checking and production bundle passed; JS 274.90 kB / 85.20 kB gzip |
| `npm test` | 17/17 tests; overnight and >24h duration, pause accounting, overlap/future validation, exact-ID deletion, CSV escaping, strict backup parsing, original storage preservation, legacy migration without credentials |
| `npm run test:e2e` | 18/18 passed in 28.4 seconds: 9 each for desktop Chrome and mobile Chrome emulating iPhone 13 |
| Main flows | Clock/pause/reload/resume/stop, booking edit/delete/filter, profile/theme/reload, backup export/confirmed import, malformed import rejection, legacy migration |
| Multi-tab protection | Held Web Lock forced simultaneous writes; conflicting save rejected. Open stale booking editor rejected after other tab updated record |
| Mobile layout | At 390px, document width equals viewport; all four views navigable; horizontal booking table scroll remains inside its container |
| Print export | Actual generated PDF reopened with PDFium: one A4 page, extracted expected date, 09:00-17:30 interval, 30-minute break, 08:00 total; rendered preview inspected for clipping |
| Runtime errors | No page errors observed in complete view-navigation scenario |

Screenshots and report:

- [Desktop dashboard with isolated demo data](evidence/desktop-dashboard.png)
- [Mobile dashboard](evidence/mobile-dashboard.png)
- [Mobile initial viewport](evidence/mobile-viewport.png)
- [Desktop report](evidence/desktop-reports.png)
- [Mobile report](evidence/mobile-reports.png)
- [Actual PDF export](evidence/report.pdf), [rendered PDF preview](evidence/report-preview.png)

## Resolved findings

- Initial mobile overflow came from an absolutely positioned hidden table heading escaping its scroll container. Relative containment and explicit hidden-element positioning fixed document overflow and obstructed navigation.
- Asynchronous Web Lock writes required UI save-state handling and assertions that wait for committed UI, rather than reading localStorage immediately after a click.
- Legacy `cst` is an authorization token, verified against `src/app/core/http/http.token.interceptor.ts`; it is explicitly excluded from migration and backups.
- Demo data stays in memory and never changes the user's stored dataset.

## Remaining limits

- Browser QA covered Chromium on desktop and an emulated mobile viewport, not physical iOS/Safari devices.
- No old server data was available to migrate; legacy conversion was verified with representative fixtures.
- This is a local single-user application, not a cloud service or packaged native mobile app.

## GitHub publication

- Source repository: private `DomEscobar/timeattendance`, branch `master`.
- GitHub rejected Pages activation on the private repository with HTTP 422: current plan does not support Pages for this repository.
- Public deployment repository: `DomEscobar/timeattendance-pages`, contains production assets, `.nojekyll`, a styled website README, a vector cover, and two explicitly selected app screenshots; source visibility is unchanged.
- Website: https://domescobar.github.io/timeattendance-pages/
- Vite base is configurable through `VITE_BASE_PATH`; the Pages build uses `/timeattendance-pages/`.
- `.github/workflows/ci.yml` verifies tests/build and uploads a build artifact. `npm run publish:pages` performs subsequent deployments without storing tokens or configuring cross-repository CI credentials.
- Browser data remains local to each visitor; existing localhost records require backup/import to transfer to the hosted origin.
- The user explicitly approved creating the public deployment repository and requested an aesthetic README. Publication assets are allowlisted in `scripts/publish-pages.mjs`.
