import { Parser, Store, DataFactory } from 'n3';
import type { TreeItem } from '../types/tree';
import { logger } from './logger';

export type Vocab = 'skos' | 'pcicore';
export interface ParseResult { tree: TreeItem[]; vocab: Vocab; }

const { namedNode } = DataFactory;

// Common prefixes that real-world Turtle files sometimes omit
const IMPLICIT_PREFIXES: Record<string, string> = {
  rdf:  'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl:  'http://www.w3.org/2002/07/owl#',
  xsd:  'http://www.w3.org/2001/XMLSchema#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
};


function injectMissingPrefixes(ttl: string): string {
  const injections: string[] = [];
  const injectedNames: string[] = [];
  for (const [prefix, uri] of Object.entries(IMPLICIT_PREFIXES)) {
    const declared = new RegExp(`@prefix\\s+${prefix}\\s*:`, 'i').test(ttl);
    const used = new RegExp(`\\b${prefix}:`).test(ttl);
    if (used && !declared) {
      injections.push(`@prefix ${prefix}: <${uri}> .`);
      injectedNames.push(prefix);
      logger.debug(`[parseTurtle] detected usage of prefix "${prefix}" without declaration, injecting it automatically`);
    }
  }
  if (injectedNames.length) logger.debug('[parseTurtle] injected missing prefixes:', injectedNames.join(', '));
  return injections.length ? injections.join('\n') + '\n' + ttl : ttl;
}

const RDF_TYPE      = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const SKOS          = 'http://www.w3.org/2004/02/skos/core#';
const CONCEPT       = SKOS + 'Concept';
const PREF_LABEL    = SKOS + 'prefLabel';
const NARROWER      = SKOS + 'narrower';
const BROADER       = SKOS + 'broader';
const HAS_TOP       = SKOS + 'hasTopConcept';
const TOP_OF        = SKOS + 'topConceptOf';        // inverse of hasTopConcept

const PCICORE       = 'http://onto.wolterskluwer.com/pci/core/';
const IS_CONTAINED  = PCICORE + 'isContained';      // child → parent (like skos:broader)
const TO_CHILD      = PCICORE + 'relatesToChild';   // parent → child (like skos:narrower)

const DCTERMS_TITLE = 'http://purl.org/dc/terms/title';
const RDFS_LABEL    = 'http://www.w3.org/2000/01/rdf-schema#label';

const LABEL_PREDS = [PREF_LABEL, DCTERMS_TITLE, RDFS_LABEL];

function localName(uri: string): string {
  const hash = uri.lastIndexOf('#');
  if (hash >= 0) return uri.slice(hash + 1);
  const slash = uri.lastIndexOf('/');
  return slash >= 0 ? uri.slice(slash + 1) : uri;
}

function pickLiteral(store: Store, uri: string, predicate: string): string | null {
  const literals = store.getObjects(namedNode(uri), namedNode(predicate), null)
    .filter(o => o.termType === 'Literal');
  if (!literals.length) return null;
  return (
    literals.find(l => l.language === 'en') ??
    literals.find(l => l.language) ??
    literals[0]
  ).value;
}

function getLabel(store: Store, uri: string): string {
  for (const pred of LABEL_PREDS) {
    const label = pickLiteral(store, uri, pred);
    if (label) return label;
  }
  return localName(uri);
}

function buildNode(
  store: Store,
  uri: string,
  visited: Set<string>,
  narrowerPred: string,
  broaderPred: string,
): TreeItem {
  visited.add(uri);

  let childUris = store
    .getObjects(namedNode(uri), namedNode(narrowerPred), null)
    .filter(o => o.termType === 'NamedNode')
    .map(o => o.value);

  if (!childUris.length) {
    childUris = store
      .getSubjects(namedNode(broaderPred), namedNode(uri), null)
      .filter(s => s.termType === 'NamedNode')
      .map(s => s.value);
  }

  const children = childUris
    .filter(u => !visited.has(u))
    .map(u => buildNode(store, u, new Set(visited), narrowerPred, broaderPred));

  let ret= { id: uri, label: getLabel(store, uri), children };
  logger.info(ret);
  return ret;
}

// ── pcicore hierarchy (pcicore:isContained / pcicore:relatesToChild) ──────────

function buildPcicoreTree(store: Store): TreeItem[] {
  // All children (subjects of isContained)
  const isContainedSubjects = new Set(
    store.getSubjects(namedNode(IS_CONTAINED), null, null)
      .filter(s => s.termType === 'NamedNode')
      .map(s => s.value)
  );

  // Roots = objects of isContained that are not themselves contained
  const roots = store
    .getObjects(null, namedNode(IS_CONTAINED), null)
    .filter(o => o.termType === 'NamedNode' && !isContainedSubjects.has(o.value))
    .map(o => o.value);
  
  logger.debug('[buildPcicoreTree] found root candidates:', roots);

  const uniqueRoots = [...new Set(roots)];
  if (!uniqueRoots.length) throw new Error('No SKOS concepts found');

  return uniqueRoots.map(uri => buildNode(store, uri, new Set(), TO_CHILD, IS_CONTAINED));
}

// ── SKOS hierarchy ────────────────────────────────────────────────────────────

function buildSkosTree(store: Store): TreeItem[] {
  const allConcepts = store
    .getSubjects(namedNode(RDF_TYPE), namedNode(CONCEPT), null)
    .filter(s => s.termType === 'NamedNode')
    .map(s => s.value);

  if (!allConcepts.length) throw new Error('No SKOS concepts found');

  // Roots from skos:hasTopConcept (scheme → concept)
  const fromHasTop = store
    .getObjects(null, namedNode(HAS_TOP), null)
    .filter(o => o.termType === 'NamedNode')
    .map(o => o.value);

  // Roots from skos:topConceptOf (concept → scheme) — inverse direction
  const fromTopOf = store
    .getSubjects(namedNode(TOP_OF), null, null)
    .filter(s => s.termType === 'NamedNode')
    .map(s => s.value);

  // Explicit root candidates from both directions
  const explicitRoots = [...new Set([...fromHasTop, ...fromTopOf])];

  const hasBroader = new Set(
    store
      .getSubjects(namedNode(BROADER), null, null)
      .filter(s => s.termType === 'NamedNode')
      .map(s => s.value)
  );

  const roots = explicitRoots.length
    ? explicitRoots
    : allConcepts.filter(u => !hasBroader.has(u));

  return (roots.length ? roots : allConcepts)
    .map(uri => buildNode(store, uri, new Set(), NARROWER, BROADER));
}

// ── Public API ────────────────────────────────────────────────────────────────

export function parseTurtle(ttlText: string): ParseResult {
  const parser = new Parser();
  let quads;
  try {
    quads = parser.parse(injectMissingPrefixes(ttlText));
  } catch (e) {
    throw new Error(`Invalid Turtle: ${(e as Error).message}`);
  }
  console.debug('[parseTurtle] parsed quads:', quads);
  logger.info('[parseTurtle] parsed quads:', quads);

  const store = new Store(quads);

  const usePcicore = store
    .getSubjects(namedNode(IS_CONTAINED), null, null)
    .some(s => s.termType === 'NamedNode');

  const vocab: Vocab = usePcicore ? 'pcicore' : 'skos';
  logger.debug('[parseTurtle] detected vocabulary:', vocab);

  const tree = usePcicore ? buildPcicoreTree(store) : buildSkosTree(store);
  logger.info(tree);
  return { tree, vocab };
}
