## ADDED Requirements

### Requirement: Loader creates a NamedGraph registry node for every file
The system SHALL create exactly one `:NamedGraph` node per loaded file using `MERGE` on `uri`, setting `label`, `sourceFile`, `format`, `loadedAt`, and `tripleCount` (from `store.size` — the parser's own count) immediately at creation time with no separate update step.

#### Scenario: NamedGraph created on first load
- **WHEN** a Turtle file is loaded for the first time
- **THEN** a `:NamedGraph` node exists with the correct `uri`, `label`, `sourceFile`, `format`, `loadedAt`, and `tripleCount`

#### Scenario: NamedGraph updated on reload
- **WHEN** a file with the same name is uploaded again
- **THEN** the existing `:NamedGraph` node is updated (via `MERGE`) and `loadedAt` reflects the new timestamp

### Requirement: Loader inserts all Concept and ConceptScheme nodes
The system SHALL insert every `skos:Concept` and `skos:ConceptScheme` resource as a Memgraph node with the correct labels, properties, and `[:IN_GRAPH]` relationship, following `memgraph_db_rules.md` sections 4.1–4.3.

Properties set on each node SHALL include all language-tagged literals for `prefLabel`, `altLabel`, `hiddenLabel`, `definition`, `scopeNote`, `example`, `historyNote`, `editorialNote`, and `changeNote` that are present in the file.

#### Scenario: Concept node has correct labels and uri property
- **WHEN** a `skos:Concept` is loaded
- **THEN** the node carries labels `:Concept` and the PascalCase graph label, and has a `uri` property equal to the concept IRI

#### Scenario: All language literals are stored as properties
- **WHEN** a concept has `skos:prefLabel` values in multiple languages
- **THEN** each language is stored as a separate property (`prefLabel_en`, `prefLabel_nl`, etc.)

#### Scenario: Every concept has an IN_GRAPH relationship
- **WHEN** any concept or scheme node is inserted
- **THEN** a `[:IN_GRAPH]` relationship connects it to the `:NamedGraph` registry node for this file

#### Scenario: No data is omitted
- **WHEN** a file with N triples is loaded (as reported by `store.size`)
- **THEN** every triple that maps to a supported concept, scheme, or relationship type is inserted into Memgraph

### Requirement: Loader inserts all within-graph relationships
The system SHALL insert `BROADER`, `NARROWER`, `RELATED`, `IN_SCHEME`, `TOP_CONCEPT_OF`, `HAS_TOP_CONCEPT`, and `MEMBER` relationships using `MERGE`, with `graph` and `loadedAt` properties, for every matching quad in the file.

#### Scenario: BROADER relationship inserted with graph property
- **WHEN** a `skos:broader` triple is present in the file
- **THEN** a `[:BROADER]` relationship exists between the two concept nodes with `graph` set to the source graph label

### Requirement: Loader inserts cross-graph mapping relationships
The system SHALL insert `EXACT_MATCH`, `CLOSE_MATCH`, `BROAD_MATCH`, `NARROW_MATCH`, and `RELATED_MATCH` relationships with `graph`, `subjectGraph`, and `objectGraph` properties.

#### Scenario: Cross-graph mapping has subjectGraph and objectGraph
- **WHEN** a `skos:exactMatch` triple is present between concepts in different graphs
- **THEN** a `[:EXACT_MATCH]` relationship exists with `subjectGraph` and `objectGraph` both set

### Requirement: Loader clears existing graph data before reload
The system SHALL delete all relationships and nodes belonging to the source graph (by `graph` property) before re-inserting, implementing reload semantics.

#### Scenario: Reload replaces previous data
- **WHEN** a file is uploaded a second time
- **THEN** nodes and relationships from the previous load are removed before new data is inserted

### Requirement: Loader logs progress to the server console
The system SHALL emit console log messages for: upload received, validation result, triple count, scheme count, concept count, relationship count, mapping count, and any errors or skipped items.

#### Scenario: Successful load produces a complete log
- **WHEN** a file is successfully loaded
- **THEN** console output contains the filename, graph label, triple count, and counts for each inserted entity type
