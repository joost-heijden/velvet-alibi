# QA Notes

Date: 2026-06-24

## Automated Checks

All current checks passed:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run qa:e2e
```

Results:

- Lint: passed with `oxlint`.
- Typecheck: passed with `tsc -b --pretty false`.
- Unit/component tests: 4 files, 9 tests passed.
- Production build: passed; PWA service worker generated; precache 16 entries, 706 KB.
- Playwright QA: passed against production preview.

## Playwright Coverage

Viewport coverage:

- Mobile: 390 x 844
- Desktop: 1440 x 1000

Flow coverage:

- Loaded first case from production preview
- Verified mobile app shell and first case visibility
- Tapped a grid cell and triggered a wrong grid check
- Used one hint
- Made a wrong accusation
- Filled solution in `?qa=1` QA mode
- Made the correct accusation
- Generated share result copy
- Verified desktop layout and finale panel
- Fetched `manifest.webmanifest`

Screenshots:

- `docs/screenshots/mobile-start.png`
- `docs/screenshots/mobile-solved.png`
- `docs/screenshots/desktop-start.png`

## Visual QA

- Mobile grid, palette, clues, hint panel and accusation controls fit without text overlap.
- Desktop layout uses a two-column game/notebook composition with no nested-card clutter.
- Touch targets are at least 44px for primary controls and grid cells.
- Contrast checked visually on warm paper backgrounds; status states use distinct color and icon changes.
- Sticky header was removed after screenshot QA showed a full-page capture artifact; the topbar is now static to avoid scroll overlap.

## Local Preview

The production preview is running at:

```text
http://127.0.0.1:4173
```

Note: `npm run qa:e2e` may emit a Node warning about Windows shell argument handling while starting `npm run preview`; the QA run exits successfully.
