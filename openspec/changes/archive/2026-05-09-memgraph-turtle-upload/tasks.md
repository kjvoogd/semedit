## 1. Server dependencies and project setup

- [x] 1.1 Run `pnpm add express multer neo4j-driver` to add server-side dependencies
- [x] 1.2 Run `pnpm add -D @types/express @types/multer` to add TypeScript types (or confirm server uses plain JS)
- [x] 1.3 Add a `"server"` script to `package.json`: `"server": "node server/index.js"` and a `"dev:all"` script that runs Vite and the server concurrently (use `concurrently` or two terminal tabs)
- [x] 1.4 Create the `server/` directory structure: `server/index.js`, `server/routes/upload.js`, `server/services/memgraphLoader.js`, `server/security/SecurityTombola.js`

## 2. SecurityTombola class

- [x] 2.1 Create `server/security/SecurityTombola.js` with a `SecurityError` class (extends `Error`) and a `SecurityTombola` class
- [x] 2.2 Implement `SecurityTombola.check(file)` that validates: extension is `.ttl`, MIME type is `text/turtle`, `application/x-turtle`, or blank/`application/octet-stream`, size ≤ 50 MB, content is valid UTF-8, content does not start with a binary magic byte
- [x] 2.3 Each failed check throws a `SecurityError` with a descriptive message
- [x] 2.4 `SecurityTombola` has no imports of Express, multer, neo4j-driver, or N3

## 3. Memgraph loader service

- [x] 3.1 Create `server/services/memgraphLoader.js` — implement `toGraphLabel(filename)` (PascalCase from filename stem) and `toGraphUri(filename)` helpers
- [x] 3.2 Implement `createIndexes(session)` that runs all required `CREATE INDEX ON` Cypher statements (`:Concept(uri)`, `:ConceptScheme(uri)`, `:NamedGraph(uri)`, `:Concept(graph)`, `:ConceptScheme(graph)`, `:Concept(prefLabel_en)`, `:Concept(prefLabel_nl)`)
- [x] 3.3 Implement `clearGraph(session, graphLabel)` — delete relationships and nodes by `graph` property
- [x] 3.4 Implement `createNamedGraph(session, graphUri, graphLabel, sourceFile, tripleCount)` — `MERGE` on `uri`, set all properties including `tripleCount` from the parser (no separate update step)
- [x] 3.5 Implement `loadSchemes(session, store, graphUri, graphLabel)` — iterate `rdf:type skos:ConceptScheme` quads, build props with `buildProps()`, run `MERGE (n:ConceptScheme:${graphLabel} { uri })` Cypher, attach `[:IN_GRAPH]`
- [x] 3.6 Implement `loadConcepts(session, store, graphUri, graphLabel)` — iterate `rdf:type skos:Concept` quads, build props with `buildProps()` (all literal predicates: prefLabel, altLabel, hiddenLabel, definition, scopeNote, example, historyNote, editorialNote, changeNote), run `MERGE (n:Concept:${graphLabel} { uri })` Cypher, attach `[:IN_GRAPH]`
- [x] 3.7 Implement `buildProps(store, uri, graphLabel)` — collects all language-tagged literals from the store for a given subject and returns a flat props object (`prefLabel_en`, `altLabel_nl`, etc.)
- [x] 3.8 Implement `loadRelationships(session, store, graphLabel)` — for each of BROADER, NARROWER, RELATED, IN_SCHEME, TOP_CONCEPT_OF, HAS_TOP_CONCEPT, MEMBER: iterate quads, `MERGE (a)-[r:TYPE]->(b)`, set `r.graph` and `r.loadedAt`
- [x] 3.9 Implement `loadMappings(session, store, graphLabel)` — for EXACT_MATCH, CLOSE_MATCH, BROAD_MATCH, NARROW_MATCH, RELATED_MATCH: iterate quads, look up `objectGraph` from Memgraph, `MERGE` relationship with `graph`, `subjectGraph`, `objectGraph`, `loadedAt`; log a warning for each skipped mapping (object node not found)
- [x] 3.10 Implement `loadFile(driver, filename, buffer)` — orchestrate steps 1–8 per `memgraph_db_rules.md`: parse buffer with N3.js, capture `store.size` as `tripleCount`, clear, createNamedGraph, loadSchemes, loadConcepts, loadRelationships, loadMappings; return `{ graphLabel, tripleCount, schemeCount, conceptCount, relCount, mapCount }`
- [x] 3.11 Add console logging in `loadFile` at each step: `[loader] ${filename} → ${graphLabel}`, parsed triple count, cleared, scheme/concept/rel/map counts, and any errors

## 4. Express server entry point

- [x] 4.1 Create `server/index.js` — create Express app, add `express.json()` middleware, mount the upload router at `/api`, start listening on port 3001
- [x] 4.2 On startup, open a neo4j-driver session and call `createIndexes(session)` before the server starts accepting requests; log `[server] Memgraph indexes ready`
- [x] 4.3 Export the neo4j driver instance so routes can use it without re-creating it

## 5. Upload route

- [x] 5.1 Create `server/routes/upload.js` — configure multer with `memoryStorage` and a 50 MB `fileSize` limit
- [x] 5.2 Implement `POST /upload` handler: extract file from `req.file`, call `SecurityTombola.check(req.file)`, call `memgraphLoader.loadFile()`, return `{ ok: true, graphLabel, tripleCount, nodeCount }` on success
- [x] 5.3 Catch `SecurityError` → respond 400 `{ ok: false, error: e.message }`; catch other errors → respond 500 `{ ok: false, error: e.message }`; log both to console with `[upload]` prefix
- [x] 5.4 Implement `GET /tree` handler: query Memgraph for the most recently loaded graph (latest `loadedAt` on `:NamedGraph`), build a flat list of `{ id, label, parentId }` records, convert to `TreeItem[]` in JS, return as JSON; return `[]` if no graphs are loaded
- [x] 5.5 Log each `GET /tree` call: `[tree] returning N root nodes`

## 6. Vite proxy configuration

- [x] 6.1 Update `vite.config.ts` to add `server.proxy`: `{ '/api': { target: 'http://localhost:3001', changeOrigin: true } }`

## 7. Frontend changes

- [x] 7.1 Update `handleImport` in `src/App.tsx`: replace the in-browser `parseTurtle` call with a `fetch('POST /api/upload', FormData)` call; on success call `refetch()` (or equivalent) to reload the tree from `GET /api/tree`; on error display the server's error message via `setImportError`
- [x] 7.2 Remove the `import { parseTurtle }` import from `App.tsx` (the server now handles parsing); confirm `parseTurtle.ts` can remain for other uses or mark it as server-replaced

## 8. Verification

- [x] 8.1 Run `pnpm type-check` and fix any TypeScript errors
- [x] 8.2 Start Memgraph Docker (`docker run -p 7687:7687 -p 7444:7444 --name memgraph memgraph/memgraph-mage`) and confirm it is reachable
- [x] 8.3 Start the Express server (`node server/index.js`) and confirm `[server] Memgraph indexes ready` is logged
- [x] 8.4 Start Vite dev server (`pnpm dev`) and confirm `/api/*` requests are proxied correctly
- [x] 8.5 Upload `tests/samplefiles/WKNL_PracticalContent_CHM.ttl` via the Import button and confirm: 200 response, server logs show triple count and insert counts, browser tree reloads showing the hierarchy
- [x] 8.6 Upload `tests/samplefiles/eurovoc_metadata.ttl` and confirm all concepts and relationships are inserted (check server log counts)
- [x] 8.7 Upload a non-Turtle file and confirm: SecurityTombola rejects it, 400 response, error shown in header, tree unchanged
- [x] 8.8 Upload `WKNL_PracticalContent_CHM.ttl` a second time and confirm reload semantics: old data cleared, new data inserted, log shows cleared + re-inserted
- [x] 8.9 Query Memgraph directly (`MATCH (n:Concept) RETURN count(n)`) and confirm node count matches the server log
