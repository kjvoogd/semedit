## Context

`src/lib/parseTurtle.ts` and `src/App.tsx` silently succeed or throw errors with no intermediate visibility. Developers can only observe outcomes (tree appears / error message shown), not what happened internally. The fix is a thin logger that wraps `console.*` and filters by level.

## Goals / Non-Goals

**Goals:**
- Single `Logger` class/singleton usable anywhere in the app
- Four levels: `error < info < debug < trace` — messages below the active level are suppressed
- Active level controlled by a constant (easy to change at dev time; can later be driven by env var)
- `info`-level logging of file import events: filename, byte size, detected vocabulary (`skos`/`pcicore`), node count
- `error`-level logging of parse failures
- `debug`/`trace`-level logging inside `parseTurtle` for prefix injection and predicate detection

**Non-Goals:**
- Remote log shipping / telemetry
- Persistent log storage
- UI log viewer
- Runtime level switching via settings panel

## Decisions

**1. Thin wrapper over `console.*`, not a third-party library**
The app has no existing logging infrastructure and no runtime server. A 20-line class over `console.log/debug/warn/error` is zero-dependency and tree-shakeable. Libraries like `loglevel` or `winston` add weight with no benefit here.

**2. Module-level singleton (`logger.ts` exports a pre-created instance)**
Callers do `import { logger } from '../lib/logger'` and call `logger.info(...)`. No dependency injection needed for a front-end-only logger with a single shared instance.

**3. Level stored as a module constant, not `localStorage` or env var**
Keeps the implementation simple for now. The constant is easy to edit and the decision is reversible if a runtime toggle is needed later.

**4. Map levels to matching `console` methods**
`error` → `console.error`, `info` → `console.info`, `debug` → `console.debug`, `trace` → `console.trace`. This preserves browser devtools level filtering for free.

## Risks / Trade-offs

- **Debug noise in production**: Default level `info` suppresses debug/trace output. As long as the shipped bundle keeps the default, this is fine. → Mitigation: document the constant and keep default at `info`.
- **`console.trace` prints a stack trace**: Useful for deep tracing but verbose. → Mitigation: use `trace` only for very low-level steps; callers should be deliberate.

## Migration Plan

No migration required. Logger calls are additive; no existing behaviour changes.
