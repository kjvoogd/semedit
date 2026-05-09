import { Store, Parser } from 'n3'
import neo4j from 'neo4j-driver'

const SKOS = 'http://www.w3.org/2004/02/skos/core#'
const RDF  = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
const GRAPH_BASE_URI = 'https://semedit.local/graph/'

export function toGraphLabel(filename) {
  const stem = filename.replace(/\.[^.]+$/, '')
  return stem
    .split(/[-_\s]+/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('')
}

export function toGraphUri(filename) {
  const stem = filename.replace(/\.[^.]+$/, '')
  return GRAPH_BASE_URI + stem
}

export async function createIndexes(session) {
  const indexes = [
    'CREATE INDEX ON :Concept(uri)',
    'CREATE INDEX ON :ConceptScheme(uri)',
    'CREATE INDEX ON :NamedGraph(uri)',
    'CREATE INDEX ON :Concept(graph)',
    'CREATE INDEX ON :ConceptScheme(graph)',
    'CREATE INDEX ON :Concept(prefLabel_en)',
    'CREATE INDEX ON :Concept(prefLabel_nl)',
  ]
  for (const cypher of indexes) {
    try {
      await session.run(cypher)
    } catch (e) {
      // Memgraph returns an error if the index already exists — safe to ignore
      if (!e.message?.includes('already exists') && !e.message?.includes('equivalent')) {
        console.warn('[loader] index warning:', e.message)
      }
    }
  }
}

export async function clearGraph(session, graphLabel) {
  await session.run('MATCH ()-[r {graph: $graph}]-() DELETE r', { graph: graphLabel })
  await session.run('MATCH (n {graph: $graph}) DETACH DELETE n', { graph: graphLabel })
  console.log(`[loader] cleared: ${graphLabel}`)
}

export async function createNamedGraph(session, graphUri, graphLabel, sourceFile, tripleCount) {
  await session.run(
    `MERGE (g:NamedGraph { uri: $uri })
     SET
       g.label       = $label,
       g.sourceFile  = $sourceFile,
       g.format      = 'turtle',
       g.loadedAt    = datetime(),
       g.tripleCount = $tripleCount`,
    { uri: graphUri, label: graphLabel, sourceFile, tripleCount: neo4j.int(tripleCount) }
  )
}

function getLiterals(store, subjectUri, predicate) {
  const result = {}
  for (const quad of store.getQuads(subjectUri, predicate, null, null)) {
    if (quad.object.termType === 'Literal') {
      const lang = quad.object.language || 'und'
      result[lang] = quad.object.value
    }
  }
  return result
}

function getLiteralArrays(store, subjectUri, predicate) {
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

export function buildProps(store, uri, graphLabel) {
  const props = { uri, graph: graphLabel }

  const singles = {
    prefLabel:     `${SKOS}prefLabel`,
    definition:    `${SKOS}definition`,
    scopeNote:     `${SKOS}scopeNote`,
    example:       `${SKOS}example`,
    historyNote:   `${SKOS}historyNote`,
    editorialNote: `${SKOS}editorialNote`,
    changeNote:    `${SKOS}changeNote`,
  }

  const arrays = {
    altLabel:    `${SKOS}altLabel`,
    hiddenLabel: `${SKOS}hiddenLabel`,
  }

  for (const [key, pred] of Object.entries(singles)) {
    for (const [lang, val] of Object.entries(getLiterals(store, uri, pred))) {
      props[`${key}_${lang}`] = val
    }
  }

  for (const [key, pred] of Object.entries(arrays)) {
    for (const [lang, vals] of Object.entries(getLiteralArrays(store, uri, pred))) {
      props[`${key}_${lang}`] = vals
    }
  }

  return props
}

export async function loadSchemes(session, store, graphUri, graphLabel) {
  let count = 0
  for (const quad of store.getQuads(null, `${RDF}type`, `${SKOS}ConceptScheme`, null)) {
    const uri = quad.subject.value
    if (quad.subject.termType !== 'NamedNode') continue
    const props = buildProps(store, uri, graphLabel)
    await session.run(
      `MERGE (n:ConceptScheme { uri: $uri })
       SET n += $props
       WITH n
       CALL { WITH n SET n:\`${graphLabel}\` }
       WITH n
       MATCH (g:NamedGraph { uri: $graphUri })
       MERGE (n)-[:IN_GRAPH]->(g)`,
      { uri, props, graphUri }
    )
    count++
  }
  return count
}

export async function loadConcepts(session, store, graphUri, graphLabel) {
  let count = 0
  for (const quad of store.getQuads(null, `${RDF}type`, `${SKOS}Concept`, null)) {
    const uri = quad.subject.value
    if (quad.subject.termType !== 'NamedNode') continue
    const props = buildProps(store, uri, graphLabel)
    await session.run(
      `MERGE (n:Concept { uri: $uri })
       SET n += $props
       WITH n
       CALL { WITH n SET n:\`${graphLabel}\` }
       WITH n
       MATCH (g:NamedGraph { uri: $graphUri })
       MERGE (n)-[:IN_GRAPH]->(g)`,
      { uri, props, graphUri }
    )
    count++
  }
  return count
}

export async function loadRelationships(session, store, graphLabel) {
  const WITHIN_GRAPH = [
    [`${SKOS}broader`,       'BROADER'],
    [`${SKOS}narrower`,      'NARROWER'],
    [`${SKOS}related`,       'RELATED'],
    [`${SKOS}inScheme`,      'IN_SCHEME'],
    [`${SKOS}topConceptOf`,  'TOP_CONCEPT_OF'],
    [`${SKOS}hasTopConcept`, 'HAS_TOP_CONCEPT'],
    [`${SKOS}member`,        'MEMBER'],
  ]
  let count = 0
  for (const [predUri, relType] of WITHIN_GRAPH) {
    for (const quad of store.getQuads(null, predUri, null, null)) {
      if (quad.subject.termType !== 'NamedNode') continue
      if (quad.object.termType  !== 'NamedNode') continue
      await session.run(
        `MATCH (a { uri: $subUri })
         MATCH (b { uri: $objUri })
         MERGE (a)-[r:${relType}]->(b)
         SET r.graph    = $graph,
             r.loadedAt = datetime()`,
        { subUri: quad.subject.value, objUri: quad.object.value, graph: graphLabel }
      )
      count++
    }
  }
  return count
}

export async function loadMappings(session, store, graphLabel) {
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

      const res = await session.run(
        'MATCH (b:Concept { uri: $uri }) RETURN b.graph AS graph LIMIT 1',
        { uri: quad.object.value }
      )
      if (res.records.length === 0) {
        console.warn(`[loader] mapping target not found, skipping: ${quad.object.value}`)
        continue
      }
      const objectGraph = res.records[0].get('graph')

      await session.run(
        `MATCH (a { uri: $subUri })
         MATCH (b { uri: $objUri })
         MERGE (a)-[r:${relType}]->(b)
         SET r.graph        = $graph,
             r.subjectGraph = $graph,
             r.objectGraph  = $objectGraph,
             r.loadedAt     = datetime()`,
        { subUri: quad.subject.value, objUri: quad.object.value, graph: graphLabel, objectGraph }
      )
      count++
    }
  }
  return count
}

const IMPLICIT_PREFIXES = {
  rdf:  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl:  'http://www.w3.org/2002/07/owl#',
  xsd:  'http://www.w3.org/2001/XMLSchema#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
}

function injectMissingPrefixes(ttl) {
  const injections = []
  for (const [prefix, uri] of Object.entries(IMPLICIT_PREFIXES)) {
    const declared = new RegExp(`@prefix\\s+${prefix}\\s*:`, 'i').test(ttl)
    const used     = new RegExp(`\\b${prefix}:`).test(ttl)
    if (used && !declared) injections.push(`@prefix ${prefix}: <${uri}> .`)
  }
  return injections.length ? injections.join('\n') + '\n' + ttl : ttl
}

export async function loadFile(driver, filename, buffer) {
  console.log(`[loader] ${filename} → parsing`)

  const ttl = injectMissingPrefixes(buffer.toString('utf-8'))

  const store = await new Promise((resolve, reject) => {
    const s = new Store()
    const parser = new Parser({ format: 'Turtle' })
    parser.parse(ttl, (err, quad) => {
      if (err) return reject(err)
      if (quad) s.addQuad(quad)
      else resolve(s)
    })
  })

  const tripleCount = store.size
  console.log(`[loader] ${filename} → parsed ${tripleCount} triples`)

  const graphLabel = toGraphLabel(filename)
  const graphUri   = toGraphUri(filename)
  console.log(`[loader] ${filename} → ${graphLabel}`)

  const session = driver.session()
  try {
    await clearGraph(session, graphLabel)
    await createNamedGraph(session, graphUri, graphLabel, filename, tripleCount)

    const schemeCount  = await loadSchemes(session, store, graphUri, graphLabel)
    console.log(`[loader] schemes: ${schemeCount}`)

    const conceptCount = await loadConcepts(session, store, graphUri, graphLabel)
    console.log(`[loader] concepts: ${conceptCount}`)

    const relCount     = await loadRelationships(session, store, graphLabel)
    console.log(`[loader] relationships: ${relCount}`)

    const mapCount     = await loadMappings(session, store, graphLabel)
    console.log(`[loader] mappings: ${mapCount}`)

    return { graphLabel, tripleCount, schemeCount, conceptCount, relCount, mapCount }
  } finally {
    await session.close()
  }
}
