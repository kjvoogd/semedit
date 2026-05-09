## Why

The current import flow parses Turtle files only in the browser and stores the result in sessionStorage, making the data ephemeral and inaccessible to other tools or users. Persisting RDF data into Memgraph gives the data a permanent, queryable home and enables future cross-graph analysis.

## What Changes

- **NEW** Express.js server (`server/`) with a `POST /api/upload` endpoint that accepts a `.ttl` file, validates it via `SecurityTombola`, parses it with N3.js, and inserts it into Memgraph following `src/rules/memgraph_db_rules.md`
- **NEW** `SecurityTombola` class that performs server-side security checks on the uploaded file (extension, MIME type, size limit, valid UTF-8 Turtle content)
- **NEW** `GET /api/tree` route on the Express server that queries Memgraph and returns a `TreeItem[]` JSON array (replaces the current Vite mock)
- **MODIFIED** Frontend `handleImport`: instead of parsing in-browser, POSTs the file to the server; on success the tree is reloaded via `GET /api/tree`
- **NEW** Server-side structured console logging for every upload: file metadata, validation outcome, parse stats, Memgraph insert counts, errors
- Vite dev proxy forwards `/api/*` requests to the Express server

## Capabilities

### New Capabilities
- `turtle-upload-service`: Express.js server exposing `POST /api/upload` and `GET /api/tree`
- `memgraph-rdf-loader`: Memgraph insertion logic following `memgraph_db_rules.md` (NamedGraph registry, Concept/ConceptScheme nodes, relationships, indexes)
- `file-upload-security`: `SecurityTombola` server-side security checks on uploaded files

### Modified Capabilities
- `rdf-skos-import`: Frontend import handler now POSTs to server instead of parsing in-browser; error display and tree reload flow change

## Impact

- New server entrypoint: `server/index.js`
- New modules: `server/routes/upload.js`, `server/services/memgraphLoader.js`, `server/security/SecurityTombola.js`
- New dependencies: `express`, `multer`, `neo4j-driver` (server-side); `vite` proxy config updated
- `src/App.tsx` `handleImport` updated to POST multipart/form-data
- `useTreeData` `GET /api/tree` now served by Express (no mock needed)
