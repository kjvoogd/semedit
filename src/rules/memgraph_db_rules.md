# Memgraph RDF Storage Rules
## Strategy: Node Labels + Relationship Graph Property + Graph Registry Node

---

## 1. Overview

This document defines the rules, conventions, and Cypher patterns for storing parsed RDF
files into Memgraph using a **Graph Registry Node**.

The model maps RDF concepts to Memgraph's Labeled Property Graph (LPG) as follows:

| RDF concept | Memgraph equivalent |
|---|---|
| `skos:ConceptScheme` | Node with label `:ConceptScheme` + scheme label |
| `skos:Concept` | Node with label `:Concept` + graph label |
| RDF file / named graph | `:NamedGraph` registry node |
| `skos:broader` / `skos:narrower` | `[:BROADER]` / `[:NARROWER]` relationship with `graph` property |
| `skos:related` | `[:RELATED]` relationship with `graph` property |
| `skos:inScheme` | `[:IN_SCHEME]` relationship with `graph` property |
| `skos:exactMatch` etc. | `[:EXACT_MATCH]` etc. with `subjectGraph` + `objectGraph` properties |
| `skos:prefLabel` | Node property `prefLabel` (map by language: `prefLabel_en`, `prefLabel_nl`) |
| `skos:altLabel` | Node property `altLabel_en`, `altLabel_nl` (arrays) |
| `skos:definition` | Node property `definition_en`, `definition_nl` |

---

## 2. Naming Conventions

### 2.1 Node Labels
- `:NamedGraph` — one per RDF file, always present
- `:ConceptScheme` — every `skos:ConceptScheme` resource
- `:Concept` — every `skos:Concept` resource
- Graph membership label — **PascalCase**, derived from the file name:
  - `life-sciences.ttl` → `:LifeSciences`
  - `habitat-geo.ttl` → `:HabitatGeo`
  - `ecology.ttl` → `:Ecology`

Every concept node carries **two labels**: its type (`:Concept`) and its graph (`:LifeSciences`):
```
(:Concept:LifeSciences { uri: "...", prefLabel_en: "Mammals" })
```

### 2.2 Relationship Types
All relationship types are **SCREAMING_SNAKE_CASE**:

| SKOS property | Relationship type |
|---|---|
| `skos:broader` | `[:BROADER]` |
| `skos:narrower` | `[:NARROWER]` |
| `skos:related` | `[:RELATED]` |
| `skos:inScheme` | `[:IN_SCHEME]` |
| `skos:topConceptOf` | `[:TOP_CONCEPT_OF]` |
| `skos:hasTopConcept` | `[:HAS_TOP_CONCEPT]` |
| `skos:exactMatch` | `[:EXACT_MATCH]` |
| `skos:closeMatch` | `[:CLOSE_MATCH]` |
| `skos:broadMatch` | `[:BROAD_MATCH]` |
| `skos:narrowMatch` | `[:NARROW_MATCH]` |
| `skos:relatedMatch` | `[:RELATED_MATCH]` |
| `skos:member` | `[:MEMBER]` |
| `rdf:type` | encoded as node label (not a relationship) |
| graph membership | `[:IN_GRAPH]` |

### 2.3 Property Names
- `uri` — the full IRI of the resource (always present, used as unique key)
- `prefLabel_<lang>` — preferred label per language (e.g., `prefLabel_en`, `prefLabel_nl`)
- `altLabel_<lang>` — array of alternative labels per language
- `hiddenLabel_<lang>` — array of hidden labels per language
- `definition_<lang>` — definition text per language
- `scopeNote_<lang>` — scope note per language
- `example_<lang>` — example text per language
- `historyNote_<lang>` — history note per language
- `editorialNote_<lang>` — editorial note per language
- `changeNote_<lang>` — change note per language
- `graph` — the graph label string where this node/relationship was defined
- `subjectGraph` — for cross-scheme mappings: graph of the subject concept
- `objectGraph` — for cross-scheme mappings: graph of the object concept
- `loadedAt` — datetime of import (on `:NamedGraph` and relationships)
- `sourceFile` — original filename (on `:NamedGraph`)

---

## 3. Graph Registry Node Rules

### 3.1 Structure
Every RDF file loaded into Memgraph **must** have exactly one `:NamedGraph` node created
before any of its triples are inserted. This node acts as the anchor for the entire file.

`tripleCount` is set immediately at registry node creation time, using the count provided
by the RDF parser — it reflects the exact number of triples in the source file, not a
count derived from the loader's own operations.

```cypher
MERGE (g:NamedGraph { uri: $graphUri })
SET
  g.label       = $label,
  g.sourceFile  = $sourceFile,
  g.format      = $format,
  g.loadedAt    = datetime(),
  g.tripleCount = $tripleCount
RETURN g
```

| Property | Example value | Description |
|---|---|---|
| `uri` | `"https://example.org/graph/life-sciences"` | Unique IRI for the named graph |
| `label` | `"LifeSciences"` | PascalCase graph label — same as node label |
| `sourceFile` | `"life-sciences.ttl"` | Original filename |
| `format` | `"turtle"` or `"rdf/xml"` | Source serialization |
| `loadedAt` | `datetime()` | Timestamp of last load |
| `tripleCount` | `42` | Exact number of triples in the source file (from the RDF parser) |

### 3.2 Rules
- The `uri` of a `:NamedGraph` **must be unique** across all graphs
- A `:NamedGraph` node **must** be created with `MERGE` — never `CREATE` — to allow safe reloads
- All concept and scheme nodes must have an `[:IN_GRAPH]` relationship pointing to their `:NamedGraph`
- `tripleCount` is set **once**, from the RDF parser's own count (`store.size` in N3.js),
  immediately when the registry node is created — there is no separate update step

---

## 4. Node Rules

### 4.1 ConceptScheme Node
```cypher
MERGE (s:ConceptScheme { uri: $uri })
SET
  s.graph        = $graphLabel,
  s.prefLabel_en = $prefLabelEn,
  s.prefLabel_nl = $prefLabelNl
WITH s
MATCH (g:NamedGraph { uri: $graphUri })
MERGE (s)-[:IN_GRAPH]->(g)
```

### 4.2 Concept Node
Dynamic labels (the graph membership label) are applied by constructing the Cypher
string in the loader before sending it to Memgraph — see Section 7.

```cypher
MERGE (n:Concept { uri: $uri })
SET
  n.graph         = $graphLabel,
  n.prefLabel_en  = $prefLabelEn,
  n.prefLabel_nl  = $prefLabelNl,
  n.definition_en = $definitionEn,
  n.altLabel_en   = $altLabelsEn
WITH n
MATCH (g:NamedGraph { uri: $graphUri })
MERGE (n)-[:IN_GRAPH]->(g)
```

With dynamic graph label applied at query-build time:
```cypher
MERGE (n:Concept:LifeSciences { uri: $uri })
SET n += $props
WITH n
MATCH (g:NamedGraph { uri: $graphUri })
MERGE (n)-[:IN_GRAPH]->(g)
```

### 4.3 Node Rules
- Every node **must** have a `uri` property — this is the unique key
- Every node **must** have a `graph` property matching its source graph label
- Every node **must** have an `[:IN_GRAPH]` relationship to its `:NamedGraph` node
- `MERGE` on `uri` is the idempotency key — never use `CREATE` for concept nodes
- A concept belonging to multiple schemes keeps **one node** with multiple `[:IN_SCHEME]`
  relationships — do not duplicate the node

---

## 5. Relationship Rules

### 5.1 Within-Graph Relationships
For relationships where both subject and object are in the same graph:

```cypher
MATCH (a:Concept { uri: $subjectUri })
MATCH (b:Concept { uri: $objectUri })
MERGE (a)-[r:BROADER]->(b)
SET
  r.graph    = $graphLabel,
  r.loadedAt = datetime()
```

**Rules:**
- Always use `MERGE` to avoid duplicate relationships
- Always set `r.graph` to the source graph label string
- Always set `r.loadedAt` on creation or reload

### 5.2 Cross-Graph Mapping Relationships
For `skos:exactMatch`, `skos:broadMatch`, `skos:closeMatch`, `skos:relatedMatch`,
`skos:narrowMatch` — where subject and object may be in different graphs:

```cypher
MATCH (a:Concept { uri: $subjectUri })
MATCH (b:Concept { uri: $objectUri })
MERGE (a)-[r:EXACT_MATCH]->(b)
SET
  r.graph        = $declaringGraph,
  r.subjectGraph = $subjectGraph,
  r.objectGraph  = $objectGraph,
  r.loadedAt     = datetime()
```

| Property | Value | Description |
|---|---|---|
| `graph` | `"LifeSciences"` | The file that **declared** this mapping |
| `subjectGraph` | `"LifeSciences"` | Graph owning the subject concept |
| `objectGraph` | `"Ecology"` | Graph owning the object concept |

**Rules:**
- `subjectGraph` and `objectGraph` **must always** be set on mapping relationships
- `graph` is the file that declared the mapping — usually the same as `subjectGraph`
- When deleting a graph, delete only mapping relationships where `r.graph = $graphLabel`
  — this preserves mappings declared in other files that reference this graph's concepts

### 5.3 Relationship Rules Summary
- **Never** create a relationship without a `graph` property
- **Always** use `MERGE` for relationships — never bare `CREATE` during import
- Cross-scheme mappings require both `subjectGraph` and `objectGraph` to be set
- `BROADER` and `NARROWER` are **redundant** (inverses) — store only `BROADER` and
  derive `NARROWER` via query, or store both for query performance

---

## 6. Index Rules

Create these indexes **before** any data is loaded:

```cypher
// Primary lookup index — most important
CREATE INDEX ON :Concept(uri);
CREATE INDEX ON :ConceptScheme(uri);
CREATE INDEX ON :NamedGraph(uri);

// Graph membership filtering
CREATE INDEX ON :Concept(graph);
CREATE INDEX ON :ConceptScheme(graph);

// Label search
CREATE INDEX ON :Concept(prefLabel_en);
CREATE INDEX ON :Concept(prefLabel_nl);
```

---

## 7. Load Strategy: Parsing an RDF File and Saving to Memgraph

### 7.1 Steps

```
1. Derive graph identity from filename
2. Parse RDF file with N3.js — capture tripleCount = store.size
3. Clear existing data for this graph (if reload)
4. Create NamedGraph registry node — set tripleCount immediately from parser
5. Load ConceptScheme nodes
6. Load Concept nodes
7. Load within-graph relationships (broader, narrower, related, inScheme)
8. Load cross-graph mapping relationships
```

`tripleCount` is set in step 4, directly from the parser. There is no separate update
step — the parser's own count is the authoritative source.

### 7.2 Dependencies

```bash
npm install n3 neo4j-driver
```

- **n3** — fast Turtle / N-Triples / TriG parser for Node.js
- **neo4j-driver** — official Bolt driver, fully compatible with Memgraph

### 7.3 Full Node.js Loader

```js
// rdf-loader.mjs
import { readFileSync } from 'fs'
import { Store, Parser } from 'n3'
import neo4j from 'neo4j-driver'

// ── Configuration ─────────────────────────────────────────────────────────────

const MEMGRAPH_URI  = 'bolt://localhost:7687'
const MEMGRAPH_USER = ''
const MEMGRAPH_PASS = ''

const SKOS = 'http://www.w3.org/2004/02/skos/core#'
const RDF  = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'

const GRAPH_BASE_URI = 'https://example.org/graph/'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Derive a PascalCase graph label from a filename.
 * 'life-sciences.ttl' -> 'LifeSciences'
 */
function toGraphLabel (sourceFile) {
  const stem = sourceFile.replace(/\.[^.]+$/, '')
  return stem
    .split(/[-_\s]+/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

function toGraphUri (sourceFile) {
  const stem = sourceFile.replace(/\.[^.]+$/, '')
  return GRAPH_BASE_URI + stem
}

function detectFormat (filepath) {
  if (filepath.endsWith('.ttl'))  return 'Turtle'
  if (filepath.endsWith('.n3'))   return 'Notation3'
  if (filepath.endsWith('.nt'))   return 'N-Triples'
  if (filepath.endsWith('.trig')) return 'TriG'
  return 'Turtle'
}

/**
 * Parse an RDF file into an N3 Store.
 * Returns a Promise<Store> — store.size is the authoritative triple count.
 */
function parseRdf (filepath) {
  return new Promise((resolve, reject) => {
    const store  = new Store()
    const parser = new Parser({ format: detectFormat(filepath) })
    const data   = readFileSync(filepath, 'utf-8')

    parser.parse(data, (err, quad, prefixes) => {
      if (err)   return reject(err)
      if (quad)  store.addQuad(quad)
      else       resolve(store)           // quad = null signals end of parsing
    })
  })
}

/**
 * Collect all literal values for a subject+predicate, grouped by language tag.
 * Returns { en: "Dog", nl: "Hond" }
 */
function getLiterals (store, subjectUri, predicate) {
  const result = {}
  for (const quad of store.getQuads(subjectUri, predicate, null, null)) {
    if (quad.object.termType === 'Literal') {
      const lang = quad.object.language || 'und'
      result[lang] = quad.object.value
    }
  }
  return result
}

/**
 * Collect all literal values as arrays, grouped by language tag.
 * Returns { en: ["Hound", "Dog breed"], nl: ["Hond"] }
 */
function getLiteralArrays (store, subjectUri, predicate) {
  const result = {}
  for (const quad of store.getQuads(subjectUri, predicate, null, null)) {
    if (quad.object.termType === 'Literal') {
      const lang = quad.object.language || 'und'
      if (!result[lang]) result[lang] = []
      result[lang].push(quad.object.value)
    }
  }
  return result
}

/**
 * Build a flat props object from label/note predicates for a subject.
 * e.g. { prefLabel_en: "Dog", prefLabel_nl: "Hond", definition_en: "..." }
 */
function buildProps (store, subjectUri, graphLabel) {
  const props = { uri: subjectUri, graph: graphLabel }

  const singles = {
    prefLabel:    `${SKOS}prefLabel`,
    definition:   `${SKOS}definition`,
    scopeNote:    `${SKOS}scopeNote`,
    example:      `${SKOS}example`,
    historyNote:  `${SKOS}historyNote`,
    editorialNote:`${SKOS}editorialNote`,
    changeNote:   `${SKOS}changeNote`,
  }

  const arrays = {
    altLabel:    `${SKOS}altLabel`,
    hiddenLabel: `${SKOS}hiddenLabel`,
  }

  for (const [key, pred] of Object.entries(singles)) {
    for (const [lang, val] of Object.entries(getLiterals(store, subjectUri, pred))) {
      props[`${key}_${lang}`] = val
    }
  }

  for (const [key, pred] of Object.entries(arrays)) {
    for (const [lang, vals] of Object.entries(getLiteralArrays(store, subjectUri, pred))) {
      props[`${key}_${lang}`] = vals
    }
  }

  return props
}

// ── Loader class ──────────────────────────────────────────────────────────────

class RdfLoader {
  constructor () {
    this.driver = neo4j.driver(
      MEMGRAPH_URI,
      neo4j.auth.basic(MEMGRAPH_USER, MEMGRAPH_PASS)
    )
  }

  async close () {
    await this.driver.close()
  }

  async loadFile (filepath) {
    const sourceFile = filepath.split('/').pop()
    const graphLabel = toGraphLabel(sourceFile)
    const graphUri   = toGraphUri(sourceFile)
    const format     = detectFormat(filepath)

    console.log(`\nLoading ${sourceFile} → graph label: ${graphLabel}`)

    // Step 1: Parse — store.size is the authoritative triple count
    const store = await parseRdf(filepath)
    const tripleCount = store.size
    console.log(`  Parsed ${tripleCount} triples`)

    const session = this.driver.session()
    try {
      // Step 2: Clear existing data for this graph
      await this._clearGraph(session, graphLabel)

      // Step 3: Create NamedGraph registry node — tripleCount set immediately
      await this._createNamedGraph(session, graphUri, graphLabel, sourceFile, format, tripleCount)

      // Step 4: Load ConceptSchemes
      const schemeCount = await this._loadSchemes(session, store, graphUri, graphLabel)

      // Step 5: Load Concepts
      const conceptCount = await this._loadConcepts(session, store, graphUri, graphLabel)

      // Step 6: Load within-graph relationships
      const relCount = await this._loadRelationships(session, store, graphLabel)

      // Step 7: Load cross-graph mapping relationships
      const mapCount = await this._loadMappings(session, store, graphLabel)

      console.log(`  Loaded: ${schemeCount} schemes, ${conceptCount} concepts, ` +
                  `${relCount} relationships, ${mapCount} mappings`)
      console.log(`  tripleCount (from parser): ${tripleCount}`)

    } finally {
      await session.close()
    }
  }

  // ── Step 2: Clear ───────────────────────────────────────────────────────────

  async _clearGraph (session, graphLabel) {
    // Delete relationships declared by this graph
    await session.run(
      'MATCH ()-[r {graph: $graph}]-() DELETE r',
      { graph: graphLabel }
    )
    // Delete nodes belonging to this graph
    await session.run(
      'MATCH (n {graph: $graph}) DETACH DELETE n',
      { graph: graphLabel }
    )
    console.log(`  Cleared existing data for: ${graphLabel}`)
  }

  // ── Step 3: NamedGraph ──────────────────────────────────────────────────────

  async _createNamedGraph (session, graphUri, graphLabel, sourceFile, format, tripleCount) {
    // tripleCount comes directly from store.size — the parser's own count.
    // It is set here, once, at registry creation time. There is no separate update step.
    await session.run(`
      MERGE (g:NamedGraph { uri: $uri })
      SET
        g.label       = $label,
        g.sourceFile  = $sourceFile,
        g.format      = $format,
        g.loadedAt    = datetime(),
        g.tripleCount = $tripleCount
    `, { uri: graphUri, label: graphLabel, sourceFile, format, tripleCount })
  }

  // ── Step 4: ConceptSchemes ──────────────────────────────────────────────────

  async _loadSchemes (session, store, graphUri, graphLabel) {
    const schemeType = `${RDF}type`
    const schemeClass = `${SKOS}ConceptScheme`
    let count = 0

    for (const quad of store.getQuads(null, schemeType, schemeClass, null)) {
      const uri = quad.subject.value
      if (quad.subject.termType !== 'NamedNode') continue

      const props = buildProps(store, uri, graphLabel)

      // Dynamic label baked into query string — Cypher does not support parameterised labels
      await session.run(`
        MERGE (n:ConceptScheme { uri: $uri })
        SET n += $props
        WITH n
        CALL { WITH n SET n:${graphLabel} }
        WITH n
        MATCH (g:NamedGraph { uri: $graphUri })
        MERGE (n)-[:IN_GRAPH]->(g)
      `, { uri, props, graphUri })
      count++
    }
    return count
  }

  // ── Step 5: Concepts ────────────────────────────────────────────────────────

  async _loadConcepts (session, store, graphUri, graphLabel) {
    const rdfType    = `${RDF}type`
    const conceptClass = `${SKOS}Concept`
    let count = 0

    for (const quad of store.getQuads(null, rdfType, conceptClass, null)) {
      const uri = quad.subject.value
      if (quad.subject.termType !== 'NamedNode') continue

      const props = buildProps(store, uri, graphLabel)

      // Dynamic label baked into query string
      await session.run(`
        MERGE (n:Concept { uri: $uri })
        SET n += $props
        WITH n
        CALL { WITH n SET n:${graphLabel} }
        WITH n
        MATCH (g:NamedGraph { uri: $graphUri })
        MERGE (n)-[:IN_GRAPH]->(g)
      `, { uri, props, graphUri })
      count++
    }
    return count
  }

  // ── Step 6: Within-graph relationships ─────────────────────────────────────

  async _loadRelationships (session, store, graphLabel) {
    const WITHIN_GRAPH = [
      [`${SKOS}broader`,      'BROADER'],
      [`${SKOS}narrower`,     'NARROWER'],
      [`${SKOS}related`,      'RELATED'],
      [`${SKOS}inScheme`,     'IN_SCHEME'],
      [`${SKOS}topConceptOf`, 'TOP_CONCEPT_OF'],
      [`${SKOS}hasTopConcept`,'HAS_TOP_CONCEPT'],
      [`${SKOS}member`,       'MEMBER'],
    ]
    let count = 0

    for (const [predUri, relType] of WITHIN_GRAPH) {
      for (const quad of store.getQuads(null, predUri, null, null)) {
        if (quad.subject.termType !== 'NamedNode') continue
        if (quad.object.termType  !== 'NamedNode') continue

        // Dynamic relationship type baked into query string
        await session.run(`
          MATCH (a { uri: $subUri })
          MATCH (b { uri: $objUri })
          MERGE (a)-[r:${relType}]->(b)
          SET r.graph    = $graph,
              r.loadedAt = datetime()
        `, { subUri: quad.subject.value, objUri: quad.object.value, graph: graphLabel })
        count++
      }
    }
    return count
  }

  // ── Step 7: Cross-graph mapping relationships ───────────────────────────────

  async _loadMappings (session, store, graphLabel) {
    const MAPPINGS = [
      [`${SKOS}exactMatch`,   'EXACT_MATCH'],
      [`${SKOS}closeMatch`,   'CLOSE_MATCH'],
      [`${SKOS}broadMatch`,   'BROAD_MATCH'],
      [`${SKOS}narrowMatch`,  'NARROW_MATCH'],
      [`${SKOS}relatedMatch`, 'RELATED_MATCH'],
    ]
    let count = 0

    for (const [predUri, relType] of MAPPINGS) {
      for (const quad of store.getQuads(null, predUri, null, null)) {
        if (quad.subject.termType !== 'NamedNode') continue
        if (quad.object.termType  !== 'NamedNode') continue

        // Look up the graph the object concept belongs to
        const result = await session.run(
          'MATCH (b:Concept { uri: $uri }) RETURN b.graph AS graph LIMIT 1',
          { uri: quad.object.value }
        )
        const objectGraph = result.records[0]?.get('graph') ?? 'unknown'

        await session.run(`
          MATCH (a { uri: $subUri })
          MATCH (b { uri: $objUri })
          MERGE (a)-[r:${relType}]->(b)
          SET r.graph        = $graph,
              r.subjectGraph = $graph,
              r.objectGraph  = $objectGraph,
              r.loadedAt     = datetime()
        `, {
          subUri: quad.subject.value,
          objUri: quad.object.value,
          graph: graphLabel,
          objectGraph
        })
        count++
      }
    }
    return count
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────

const loader = new RdfLoader()
try {
  await loader.loadFile('life-sciences.ttl')
  await loader.loadFile('habitat-geo.ttl')
  await loader.loadFile('ecology.ttl')
} finally {
  await loader.close()
}
```

---

## 8. Sample Cypher Queries

### 8.1 Registry & Metadata

```cypher
// List all loaded graphs with metadata
MATCH (g:NamedGraph)
RETURN g.label       AS graph,
       g.sourceFile  AS file,
       g.loadedAt    AS loadedAt,
       g.tripleCount AS triples
ORDER BY g.label;

// Check when a specific graph was last loaded
MATCH (g:NamedGraph { label: "LifeSciences" })
RETURN g.loadedAt, g.tripleCount, g.sourceFile;
```

### 8.2 Browsing Within a Single Graph

```cypher
// All top concepts in one graph
MATCH (s:ConceptScheme:LifeSciences)-[:HAS_TOP_CONCEPT]->(c:Concept)
RETURN c.uri, c.prefLabel_en;

// Full concept hierarchy in one graph (2 levels)
MATCH (parent:Concept:LifeSciences)-[r:BROADER]->(child:Concept)
WHERE r.graph = "LifeSciences"
RETURN parent.prefLabel_en AS parent, child.prefLabel_en AS child
ORDER BY parent;

// All concepts in a graph with their definition
MATCH (n:Concept:LifeSciences)
RETURN n.uri, n.prefLabel_en, n.definition_en
ORDER BY n.prefLabel_en;
```

### 8.3 Finding Polyhierarchy

```cypher
// Concepts with more than one broader parent (polyhierarchy)
MATCH (n:Concept)-[r:BROADER]->()
WITH n, count(r) AS broaderCount
WHERE broaderCount > 1
RETURN n.uri, n.prefLabel_en, broaderCount
ORDER BY broaderCount DESC;

// All paths to root for a polyhierarchical concept
MATCH path = (n:Concept { uri: "https://example.org/animals/bats" })
             -[:BROADER*1..10]->
             (root:Concept)
WHERE NOT (root)-[:BROADER]->()
RETURN [node IN nodes(path) | node.prefLabel_en] AS path;
```

### 8.4 Cross-Graph Queries

```cypher
// All cross-scheme exact matches
MATCH (a:Concept)-[r:EXACT_MATCH]->(b:Concept)
WHERE r.subjectGraph <> r.objectGraph
RETURN a.prefLabel_en  AS concept,
       r.subjectGraph  AS fromGraph,
       b.prefLabel_en  AS mappedTo,
       r.objectGraph   AS toGraph;

// All cross-scheme mappings involving a specific graph
MATCH (a:Concept)-[r]->(b:Concept)
WHERE type(r) IN ["EXACT_MATCH","CLOSE_MATCH","BROAD_MATCH","NARROW_MATCH","RELATED_MATCH"]
  AND (r.subjectGraph = "LifeSciences" OR r.objectGraph = "LifeSciences")
RETURN a.prefLabel_en, type(r), b.prefLabel_en,
       r.subjectGraph, r.objectGraph;
```

### 8.5 Reloading a Single Graph

```cypher
// Step 1: Delete all relationships declared by this graph
MATCH ()-[r { graph: "LifeSciences" }]-()
DELETE r;

// Step 2: Delete all nodes belonging to this graph
MATCH (n { graph: "LifeSciences" })
DETACH DELETE n;

// Step 3: Delete the NamedGraph registry node
MATCH (g:NamedGraph { label: "LifeSciences" })
DELETE g;

// Then re-run the loader for life-sciences.ttl
```

Or as a parameterized transaction in Node.js:
```js
const session = driver.session()
await session.run('MATCH ()-[r {graph: $g}]-() DELETE r',           { g: graphLabel })
await session.run('MATCH (n {graph: $g}) DETACH DELETE n',          { g: graphLabel })
await session.run('MATCH (g:NamedGraph {label: $g}) DELETE g',      { g: graphLabel })
await session.close()
```

### 8.6 Validation Queries

```cypher
// Concepts missing a prefLabel in English
MATCH (n:Concept)
WHERE n.prefLabel_en IS NULL
RETURN n.uri, n.graph;

// Concepts not attached to any scheme
MATCH (n:Concept)
WHERE NOT (n)-[:IN_SCHEME]->(:ConceptScheme)
RETURN n.uri, n.prefLabel_en, n.graph;

// Concepts not linked to a NamedGraph registry node
MATCH (n:Concept)
WHERE NOT (n)-[:IN_GRAPH]->(:NamedGraph)
RETURN n.uri, n.graph;

// Relationships without a graph property (data quality check)
MATCH ()-[r]->()
WHERE r.graph IS NULL
  AND type(r) <> "IN_GRAPH"
RETURN type(r), startNode(r).uri, endNode(r).uri;

// NamedGraph nodes with zero triples (empty or failed loads)
MATCH (g:NamedGraph)
WHERE g.tripleCount = 0
RETURN g.label, g.sourceFile, g.loadedAt;
```

### 8.7 Statistics

```cypher
// Triple count per graph (as reported by the RDF parser)
MATCH (g:NamedGraph)
RETURN g.label, g.tripleCount
ORDER BY g.tripleCount DESC;

// Node count per graph label
MATCH (n:Concept)
RETURN n.graph AS graph, count(n) AS concepts
ORDER BY concepts DESC;

// Relationship count per graph
MATCH ()-[r]->()
WHERE r.graph IS NOT NULL
RETURN r.graph AS graph, type(r) AS relType, count(r) AS count
ORDER BY graph, relType;
```

---

## 9. Rules Summary Table

| Rule | Requirement |
|---|---|
| Every RDF file has exactly one `:NamedGraph` node | ✅ Mandatory |
| `:NamedGraph` created with `MERGE` (never `CREATE`) | ✅ Mandatory |
| `tripleCount` set from `store.size` at registry creation time | ✅ Mandatory |
| No separate `tripleCount` update step after loading | ✅ Mandatory |
| Every concept/scheme node has a `graph` property | ✅ Mandatory |
| Every concept/scheme node has an `[:IN_GRAPH]` relationship | ✅ Mandatory |
| Every concept/scheme node has the graph membership label | ✅ Mandatory |
| Every relationship has a `graph` property | ✅ Mandatory |
| Mapping relationships have `subjectGraph` and `objectGraph` | ✅ Mandatory |
| All nodes created with `MERGE` on `uri` | ✅ Mandatory |
| All relationships created with `MERGE` | ✅ Mandatory |
| Indexes on `uri` for `:Concept`, `:ConceptScheme`, `:NamedGraph` | ✅ Mandatory |
| Reload = clear graph then re-import (not partial update) | ✅ Mandatory |
| Concept appearing in multiple schemes → one node, multiple `[:IN_SCHEME]` | ✅ Mandatory |
| Graph membership label is PascalCase derived from filename | ✅ Convention |
| Relationship types are SCREAMING_SNAKE_CASE | ✅ Convention |
| Language-specific properties use `_<lang>` suffix | ✅ Convention |
| `BROADER` and `NARROWER` stored (both directions) | ⚠️ Optional — or store only `BROADER` |
| Blank nodes as concept URIs | ❌ Not allowed |
| Relationships without `graph` property | ❌ Not allowed |
| `CREATE` instead of `MERGE` for concepts/schemes | ❌ Not allowed |
| Deriving `tripleCount` from loader operation counts | ❌ Not allowed |

---

## 10. References

- [Memgraph Cypher Documentation](https://memgraph.com/docs/querying)
- [Memgraph Data Import Best Practices](https://memgraph.com/docs/data-migration/best-practices)
- [Memgraph LPG vs RDF](https://memgraph.com/docs/data-modeling/graph-data-model/lpg-vs-rdf)
- [N3.js — RDF library for JavaScript](https://github.com/rdfjs/N3.js)
- [neo4j-driver for Node.js (Bolt-compatible with Memgraph)](https://neo4j.com/docs/javascript-manual/current/)
- [SKOS Reference — W3C](https://www.w3.org/TR/skos-reference/)
