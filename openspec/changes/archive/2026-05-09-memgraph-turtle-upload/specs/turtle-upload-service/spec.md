## ADDED Requirements

### Requirement: Server exposes a file upload endpoint
The system SHALL provide a `POST /api/upload` HTTP endpoint that accepts a `multipart/form-data` request with a single field named `file` containing a Turtle file.

#### Scenario: Valid upload returns success
- **WHEN** a valid `.ttl` file is POSTed to `POST /api/upload`
- **THEN** the server returns HTTP 200 with a JSON body containing `{ ok: true, graphLabel, tripleCount, nodeCount }`

#### Scenario: Invalid file returns 400
- **WHEN** a file that fails security checks is POSTed
- **THEN** the server returns HTTP 400 with a JSON body containing `{ ok: false, error: "<reason>" }`

#### Scenario: Server error returns 500
- **WHEN** Memgraph is unreachable or a loader step throws
- **THEN** the server returns HTTP 500 with `{ ok: false, error: "<message>" }`

### Requirement: Server exposes a tree endpoint
The system SHALL provide a `GET /api/tree` HTTP endpoint that queries Memgraph and returns the most recently loaded graph as a `TreeItem[]` JSON array.

#### Scenario: Tree returned after successful upload
- **WHEN** at least one graph has been loaded into Memgraph and `GET /api/tree` is called
- **THEN** the server returns HTTP 200 with a `TreeItem[]` JSON array representing the hierarchy of the most recently loaded graph

#### Scenario: Empty tree when no graphs loaded
- **WHEN** Memgraph contains no `:NamedGraph` nodes and `GET /api/tree` is called
- **THEN** the server returns HTTP 200 with an empty JSON array `[]`

### Requirement: Server creates Memgraph indexes on startup
The system SHALL execute the required index creation Cypher statements once when the Express server starts, before accepting any requests.

#### Scenario: Indexes exist after startup
- **WHEN** the server process starts
- **THEN** indexes on `:Concept(uri)`, `:ConceptScheme(uri)`, `:NamedGraph(uri)`, `:Concept(graph)`, `:ConceptScheme(graph)`, `:Concept(prefLabel_en)`, `:Concept(prefLabel_nl)` are present in Memgraph

### Requirement: Vite dev proxy forwards API requests to Express
The system SHALL configure the Vite development server to proxy all `/api/*` requests to the Express server so the frontend uses the same origin in development.

#### Scenario: Frontend API call reaches Express
- **WHEN** the React frontend makes a request to `/api/upload` or `/api/tree` in development
- **THEN** the request is forwarded to the Express server without CORS errors
