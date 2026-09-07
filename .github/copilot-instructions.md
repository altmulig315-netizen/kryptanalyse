# Copilot Instructions for this Codebase

## Overview
- **Architecture:** Static front‑end site built with HTML/CSS and native ES modules. One entry script wires UI modules and crypto features.
- **Entry points:** HTML in [test1/Test-index.html](test1/Test-index.html); JS entry in [test1/src/js/Test-main.js](test1/src/js/Test-main.js); CSS aggregated in [test1/src/css/Test-main.css](test1/src/css/Test-main.css).
- **Core logic:** Crypto utilities and language data live in [test1/src/js/core/utils.js](test1/src/js/core/utils.js) and [test1/src/js/core/constants.js](test1/src/js/core/constants.js).
- **Features:**
  - Caesar Analyzer/Solver in [test1/src/js/features/caesar-cipher/analyzer.js](test1/src/js/features/caesar-cipher/analyzer.js) and [test1/src/js/features/caesar-cipher/solver.js](test1/src/js/features/caesar-cipher/solver.js).
  - Password strength checker in [test1/src/js/features/password-checker/validator.js](test1/src/js/features/password-checker/validator.js).
- **UI modules:** Carousel, Gallery, Modal, Dark Mode in [test1/src/js/modules/](test1/src/js/modules/) imported and initialized from `DOMContentLoaded` in [test1/src/js/Test-main.js](test1/src/js/Test-main.js).

## Conventions & Patterns
- **ES Modules:** All JS uses module imports with relative paths; HTML loads the entry script via `<script type="module" src="src/js/Test-main.js"></script>`.
- **Initialization:** `initCarousel()`, `initGallery()`, `initDarkMode()`, `initModal()` are called on `DOMContentLoaded`. New UI modules should export `initX()` and be imported+invoked in `Test-main.js`.
- **DOM Contract:** Crypto features expect specific element IDs present in the page. Examples:
  - Analyzer updates `icValue`, `entropyValue`, `ngramScore`, etc. See usage in [test1/src/js/features/caesar-cipher/analyzer.js](test1/src/js/features/caesar-cipher/analyzer.js) and the corresponding elements in [test1/Test-index.html](test1/Test-index.html).
  - Solver reads `analysisMode`, writes to `auto-solve-panel`/`autoSolveResults` and binds action buttons (`autoSolveBtn`, `bruteForceBtn`, etc.). See [test1/src/js/features/caesar-cipher/solver.js](test1/src/js/features/caesar-cipher/solver.js) and [test1/src/js/Test-main.js](test1/src/js/Test-main.js).
  - Password Checker relies on `password`, `toggleBtn`, `strengthBar`, `strengthText`, `bitStrength`, `length`, `combinations`, `charsetSize`, `crackTime`, `lowercase`, `uppercase`, `numbers`, `symbols`, `generateBtn`, `recommendationsBox`, `recommendationsList`. The constructor returns early if `password`, `strengthBar` or `strengthText` is missing. Password generation uses `crypto.getRandomValues` with rejection sampling and a Fisher-Yates shuffle — never `Math.random()`. See [test1/src/js/features/password-checker/validator.js](test1/src/js/features/password-checker/validator.js).
- **Language data:** `ALPHABETS` and Norwegian frequency tables/bigrams/... are defined in [test1/src/js/core/constants.js](test1/src/js/core/constants.js). Utilities operate on uppercase text and include Norwegian letters `ÆØÅ`.
- **Styling:** CSS organized under [test1/src/css/](test1/src/css/) with `base`, `components`, `layout`, `modules`, `pages`. Keep class naming consistent with existing patterns (e.g., `gallery-inline`, `card-track`).

## Developer Workflow
- **Run locally:** Open [test1/Test-index.html](test1/Test-index.html) in a browser. No bundler or dev server required.
- **Linting:** Node 18 is used in CI. Install deps and run:
  - `npm run lint` → runs JS, CSS, and HTML linters
  - `npm run lint:js` → ESLint on `{js,src/js}/**/*.js`
  - `npm run lint:css` → Stylelint on `**/*.css`
  - `npm run lint:html` → HTMLHint on `**/*.html`
  See [test1/package.json](test1/package.json) and CI in [test1/.github/workflows/lint.yml](test1/.github/workflows/lint.yml).

## Integration Points
- **Add a new UI module:**
  1. Create `src/js/modules/newmodule.js` exporting `initNewModule()`.
  2. Import and call it in [test1/src/js/Test-main.js](test1/src/js/Test-main.js) inside `DOMContentLoaded`.
  3. Add required DOM nodes/IDs in [test1/Test-index.html](test1/Test-index.html).
- **Add a new feature:**
  1. Create `src/js/features/<feature>/` with focused files.
  2. Reuse helpers from [test1/src/js/core/utils.js](test1/src/js/core/utils.js) (e.g., `debounce()`, `caesarTransform()`).
  3. Wire controls and panels by following the Caesar feature’s pattern (IDs + `panelHidden` classes).
- **Extend language support:** Edit `ALPHABETS` and frequency tables in [test1/src/js/core/constants.js](test1/src/js/core/constants.js). Ensure utilities like `calculateChiSquare()` receive appropriate tables.

## Examples
- **Use Caesar helpers:** `caesarShift(text, shift)` for simple ROT; `caesarTransform(text, shift, 'norwegian', false)` for decrypt respecting `ÆØÅ`.
- **Frequency chart update:** See `updateFrequencyChart(text)` in [test1/src/js/features/caesar-cipher/analyzer.js](test1/src/js/features/caesar-cipher/analyzer.js); provide a container with `id="frequencyChart"`.
- **Carousel duplication:** `initCarousel()` clones `.card-track` children and marks duplicates with `aria-hidden` and `tabindex=-1`. Keep card markup accessible.

## Gotchas & Tips
- **IDs must exist:** Missing expected IDs will silently skip updates; check element presence before binding.
- **Uppercasing:** Most crypto functions operate on uppercase and strip non‑letters; inputs with non‑Latin or missing Norwegian letters affect scoring.
- **No build step:** Keep imports relative and paths valid from HTML (`src/js/...`). Avoid introducing bundler‑specific syntax.
- **Accessibility:** Modules set `aria-hidden` and toggle `aria` attributes; preserve these in new components.
- **CI Node version:** Target Node 18 for dev scripts to match CI.

## Feature Checklist (Ny funksjon)
- **Mappe:** Opprett `src/js/features/<feature>/` og legg logikk i små, fokuserte filer.
- **Eksport:** Eksporter funksjoner/klasser og importer i `src/js/Test-main.js`; kall dem i `DOMContentLoaded`.
- **DOM‑IDer:** Legg nødvendige elementer/IDer i `Test-index.html` (følg eksisterende mønstre: knapper, paneler, `*-hidden` klasser).
- **Stil:** Legg CSS i `src/css/modules/<feature>.css` og, ved behov, `pages/` eller `components/`.
- **Tilgjengelighet:** Bruk `role`, `aria-` og `aria-hidden` der det gir mening (se `modal` og `carousel`).
- **Lint & test:** Kjør `npm run lint` og test i nettleser før commit.
- **Dokumentasjon:** Oppdater denne filen hvis funksjonen introduserer nye mønstre/konvensjoner.

## Stylelint‑regler og ID‑navngiving
- **Farger (color-hex-length):** Bruk kort heks der mulig (`#ffffff` → `#fff`, `#00ffff66` → `#0ff6`).
- **Keyframes (keyframes-name-pattern):** Navn i kebab‑case (`title-glow`, `slide-down`).
- **Media (media-feature-range-notation):** Følg forventet syntaks for media‑range.
- **ID‑selektorer (selector-id-pattern):** Linteren foretrekker kebab‑case. Prosjektet bruker flere camelCase‑IDer (som matcher HTML/JS). Ikke endre IDer uten å oppdatere både HTML og JS‑bindings.
- **Regelvalg:** Ønsker du å beholde camelCase, juster `selector-id-pattern` i `.stylelintrc.json`. Alternativt, migrer IDer til kebab‑case og oppdater referanser i `Test-index.html` og `src/js/**/*.js`.
