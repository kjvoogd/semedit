## 1. Logger module

- [x] 1.1 Create `src/lib/logger.ts` with a `Logger` class that accepts a level (`'error' | 'info' | 'debug' | 'trace'`) and exposes `error`, `info`, `debug`, `trace` methods
- [x] 1.2 Map each method to the corresponding `console` method (`error` → `console.error`, `info` → `console.info`, `debug` → `console.debug`, `trace` → `console.trace`)
- [x] 1.3 Each method checks if the message level is ≥ the configured level; if not, it is a no-op
- [x] 1.4 Export a pre-created `logger` singleton instance with default level `info`

## 2. parseTurtle — debug/trace logging

- [x] 2.1 In `injectMissingPrefixes`, call `logger.debug` listing the names of any prefixes that were injected (skip the call if none)
- [x] 2.2 In `parseTurtle`, after vocabulary detection, call `logger.debug` to log which vocabulary was selected (`'pcicore'` or `'skos'`)

## 3. App.tsx — info/error logging on import

- [x] 3.1 In `handleImport` (success path), call `logger.info` with the filename (`file.name`), size in bytes (`file.size`), vocabulary type (return it from `parseTurtle` or detect it separately), and root node count
- [x] 3.2 In `handleImport` (error path), call `logger.error` with the filename and the error message
- [x] 3.3 Update `parseTurtle` return type or add a companion export so `handleImport` can know which vocabulary was detected (e.g. return `{ tree: TreeItem[], vocab: 'skos' | 'pcicore' }` or export a last-used variable)

## 4. Verification

- [x] 4.1 Run `pnpm type-check` and fix any errors
- [x] 4.2 Verify: open browser devtools console, import a valid SKOS `.ttl` file and confirm an `info` log line appears with filename, size, vocab `skos`, and node count
- [x] 4.3 Verify: import `WKNL_PracticalContent_CHM.ttl` and confirm `info` log shows vocab `pcicore`
- [x] 4.4 Verify: import a non-Turtle file and confirm an `error` log appears with the filename and error message
- [x] 4.5 Verify: temporarily change logger level to `debug` and confirm prefix injection and vocabulary detection messages appear in the console
