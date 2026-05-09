## Context

The app is currently a pure Vite + React SPA. The `/api/tree` endpoint is served by Vite's mock/proxy and tree data lives only in sessionStorage. There is no backend process. Adding Memgraph persistence requires a real server process alongside the Vite dev server.

Memgraph runs at `bolt://localhost:7687` with no authentication (default Docker container). N3.js is already a project dependency on the frontend; it will also be used server-side.

## Goals / Non-Goals

**Goals:**
- Express.js server process that handles file upload and Memgraph persistence
- `SecurityTombola` validates every uploaded file before it touches the parser or database
- Insert all RDF triples into Memgraph following `memgraph_db_rules.md` exactly — no data omitted
- `GET /api/tree` queries Memgraph and returns `TreeItem[]` so the browser tree reflects stored data
- Structured server-side console logging at every step (upload received, validation pass/fail, parse stats, insert counts, errors)
- Vite proxy routes `/api/*` to the Express server so the frontend URL never changes

**Non-Goals:**
- Authentication / authorisation on the server
- Multi-user or concurrent upload handling beyond what multer provides by default
- Serving the built React app from Express (Vite handles dev; production serving is a separate concern)
- Support for RDF formats other than Turtle at this stage

## Decisions

**1. Express.js + multer for file upload**
Multer is the de-facto multipart middleware for Express. It buffers the file in memory (`memoryStorage`) — avoiding disk I/O and making the buffer immediately available to `SecurityTombola` and the parser without temp-file cleanup. File size is capped at 50 MB in multer config.

**2. SecurityTombola as a standalone class**
All security logic is isolated from the route handler. `SecurityTombola.check(file)` throws a typed `SecurityError` if any check fails:
- Extension must be `.ttl`
- Declared MIME type must be `text/turtle` or `application/x-turtle` (or blank — browsers often send `application/octet-stream` for unknown types, so blank is allowed)
- File size ≤ 50 MB
- Content starts with a valid Turtle character (not a binary magic byte)
- Content is valid UTF-8 (Buffer → string decode check)

**3. memgraphLoader.js follows memgraph_db_rules.md verbatim**
The loader implements the 8-step strategy from the rules file:
1. Derive graph identity from filename (PascalCase label, base URI)
2. Parse with N3.js → `store.size` is `tripleCount`
3. Clear existing graph data (reload semantics)
4. Create `:NamedGraph` registry node with `tripleCount` from parser
5. Insert `:ConceptScheme` nodes
6. Insert `:Concept` nodes (dynamic graph label baked into Cypher string)
7. Insert within-graph relationships (BROADER, NARROWER, RELATED, IN_SCHEME, etc.)
8. Insert cross-graph mapping relationships (EXACT_MATCH, CLOSE_MATCH, etc.)

Indexes (`CREATE INDEX ON :Concept(uri)` etc.) are created once at server startup.

**4. GET /api/tree returns TreeItem[] from Memgraph**
After a successful upload the browser calls `GET /api/tree`. The route queries:
```cypher
MATCH (g:NamedGraph) WITH g ORDER BY g.loadedAt DESC LIMIT 1
MATCH (n)-[:IN_GRAPH]->(g)
OPTIONAL MATCH (n)<-[:NARROWER]-(parent)-[:IN_GRAPH]->(g)
RETURN n.uri AS id, n.prefLabel_en AS label, parent.uri AS parentId
```
The server builds a `TreeItem[]` from the flat result in JS (attach children to parents, collect roots). This replaces the Vite mock endpoint.

**5. Vite proxy**
`vite.config.ts` adds a `server.proxy` entry forwarding `/api` to `http://localhost:3001` (the Express port). This keeps the frontend URL transparent in development.

**6. Server-side logging**
Plain `console.log` / `console.error` with a `[upload]` / `[loader]` / `[security]` prefix. No third-party logging library — consistent with the existing browser logger pattern.

## Risks / Trade-offs

- **memoryStorage for uploads**: Large files (approaching 50 MB) will spike Node.js heap. → Mitigation: 50 MB cap in multer; acceptable for SKOS vocabulary files which are typically < 5 MB.
- **Dynamic Cypher label injection**: Graph membership labels are derived from filenames and injected as string literals into Cypher queries. This is the approach required by Memgraph (parameterised labels are not supported). → Mitigation: `SecurityTombola` validates the filename characters; `toGraphLabel()` sanitises to alphanumeric PascalCase before injection.
- **Reload semantics**: Every upload of the same filename clears and re-inserts the entire graph. → This matches the rules file's reload strategy and is acceptable for the current use case.
- **Cross-graph mappings require target nodes to exist**: `_loadMappings` MATCHes the object concept. If the object graph has not been loaded yet, the mapping is silently skipped. → Log a warning per skipped mapping; document that mapped graphs should be loaded first.

## Migration Plan

1. Add server dependencies (`express`, `multer`, `neo4j-driver`) to the project
2. Create `server/` folder alongside `src/`
3. Update `vite.config.ts` proxy
4. Update `src/App.tsx` `handleImport` to POST multipart/form-data
5. Start Express server alongside `pnpm dev` (add `server` script to `package.json`)
6. Run Memgraph Docker container before starting dev session
