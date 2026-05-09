## Context

Semedit is a TypeScript project. The goal is a minimal React shell — layout components and a working dev server — so future RDF/SKOS editing features have a foundation to plug into.

## Goals / Non-Goals

**Goals:**
- Add React + TypeScript to the project
- Create four layout components (Header, Footer, Navigation, MainBody) in `src/app-components/`
- Render them inside a root `App` component with placeholder text
- Enable JSX in `tsconfig.json`
- Add Vite as the dev server and bundler so the app renders in a browser

**Non-Goals:**
- Styling beyond basic structural markup
- Routing or state management
- Any RDF/SKOS logic

## Decisions

**Component per file** — Each layout piece (Header, Footer, Navigation, MainBody) gets its own `.tsx` file in `src/app-components/`. Keeps components individually importable and easy to replace.

**Functional components only** — No class components; aligns with modern React conventions and keeps the scaffold simple.

**Vite as bundler** — Vite with `@vitejs/plugin-react` replaces the previous `ts-node` dev script. It provides near-instant HMR, handles JSX transform automatically, and is the standard choice for React + TypeScript projects. Entry point is `src/main.tsx` (mounts `<App />` into `#root`); `index.html` lives at the project root per Vite convention.

**DOM lib in tsconfig** — Added `"DOM"` and `"DOM.Iterable"` to `compilerOptions.lib` so browser globals (`document`, etc.) are available to TypeScript.

## Risks / Trade-offs

- **JSX in tsconfig** → Enabling `"jsx": "react-jsx"` affects the whole project; any existing `.ts` files are unaffected since they contain no JSX.
- **Vite vs tsc build** → `vite build` now produces the browser bundle; `tsc` is retained only for `type-check`. The `build` script no longer outputs to `dist/` via `tsc` directly.
