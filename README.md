# Velvet Alibi

Mobile-first PWA prototype for an original cozy-crime logic category: sudoku-style row/column deduction meets short murder mystery dossiers.

## What It Is

Velvet Alibi is positioned as **"Sudoku meets cozy crime."** The first viewport is the playable app shell, not a landing page. Players choose a dossier, place suspects in a 5x5 Latin-grid alibi board, use clues and hints, then make a final accusation from the highlighted cell.

The prototype includes:

- 10 original playable cases in `src/data/cases.ts`
- 5 suspects per case, original rooms/objects/alibis, 8 clues each, deduction flow and verdict
- Latin-grid solver/validator in `src/game/solver.ts`
- Timer, progress, mistake tracking, hint count, completion record and share copy
- PWA manifest/service worker via `vite-plugin-pwa`
- Generated mascot and UI assets in `public/assets/`
- Unit/component tests plus Playwright QA runner

## Setup

```bash
npm install
npm run dev
```

Production preview:

```bash
npm run build
npm run preview
```

The local preview used for QA runs at `http://127.0.0.1:4173`.

## Scripts

```bash
npm run lint       # oxlint
npm run typecheck  # TypeScript project build check
npm test           # Vitest unit/component tests
npm run build      # production PWA build
npm run qa:e2e     # Playwright mobile/desktop smoke QA against preview
```

## Case Content

Add a case in `src/data/cases.ts` with:

- `suspects`: 5-6 suspects with stable `id`, display name, role, detail and color
- `rows` and `columns`: same count as suspects
- `solution`: square Latin grid using suspect IDs
- `murderCell`: row/column coordinate that points to the culprit
- `clueDrafts`: 6-10 clue objects; each clue maps to one or more constrained cells
- `deduction` and `verdict`: player-facing explanation and finale copy

Run `npm test` after adding or changing cases. The case tests call `validateCase`, which checks row/column uniqueness, clue consistency, killer-cell consistency and single-solution behavior.

## Deployment

Render Blueprint is included in `render.yaml`.

Static site settings:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Rewrite: `/*` to `/index.html`

If creating manually in Render, choose **Static Site**, connect the GitHub repo, use the build command above, and set the publish directory to `dist`.

## Project Docs

- `docs/research-notes.md`: competitor/inspiration notes
- `docs/mascot-directions.md`: mascot concepts, selected direction and generated assets
- `docs/qa.md`: executed QA matrix and screenshots
