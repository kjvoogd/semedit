## Why

The application currently has no logging, making it impossible to trace file import behaviour or diagnose issues in production. A structured logger with configurable levels gives developers visibility into what the app is doing without cluttering the UI.

## What Changes

- Add a `Logger` singleton with four levels: `error`, `info`, `debug`, `trace`
- Active log level is configured at build/startup time (default `info`)
- On file import, log the filename, size, detected vocabulary type, and resulting node count at `info` level
- Parse errors and unexpected failures are logged at `error` level
- Internal parsing steps (prefix injection, predicate detection, tree building) are logged at `debug`/`trace` level

## Capabilities

### New Capabilities
- `logging`: Structured browser logger with level filtering, used across the app

### Modified Capabilities
- `tree-navigation`: `parseTurtle` and the import handler now emit log calls (no spec-level requirement changes, just implementation)

## Impact

- New file: `src/lib/logger.ts`
- `src/lib/parseTurtle.ts` — add debug/trace logging inside parse steps
- `src/App.tsx` — add info/error logging in `handleImport`
- No new dependencies; uses `console.*` under the hood
