# RDF Structural Rules

## 1. Overview

RDF (Resource Description Framework) is the foundational data model upon which SKOS is built.
Every SKOS file is a valid RDF document. Understanding RDF rules is therefore a prerequisite
for correctly authoring and validating SKOS vocabularies.

The stack is:

```
SKOS       ← vocabulary for knowledge organization (concepts, schemes, labels)
  └── RDFS ← vocabulary for describing classes and properties
       └── RDF ← core data model (triples, URIs, literals)
```

---

## 2. RDF Core Rules

### 2.1 The Triple
- Every RDF statement is a **triple**: `subject → predicate → object`
- A set of triples forms an **RDF graph**
- Each triple makes one atomic assertion about the world

### 2.2 Subject Rules
- Subjects must be a **URI** or a **blank node**
- Subjects **cannot** be literals
- In SKOS: subjects are typically `skos:Concept` or `skos:ConceptScheme` URIs

### 2.3 Predicate Rules
- Predicates must be **URIs** only
- Predicates **cannot** be blank nodes or literals
- In SKOS: predicates are properties like `skos:prefLabel`, `skos:broader`, `skos:inScheme`

### 2.4 Object Rules
- Objects can be a **URI**, a **blank node**, or a **literal**
- In SKOS: objects are URIs (for relations), or literals (for labels and notes)

### 2.5 Summary

| Position | URI | Blank Node | Literal |
|---|---|---|---|
| Subject | ✅ Yes | ✅ Yes | ❌ No |
| Predicate | ✅ Yes | ❌ No | ❌ No |
| Object | ✅ Yes | ✅ Yes | ✅ Yes |

---

## 3. URI Rules

- A URI uniquely identifies a resource in the global RDF space
- URIs are **case-sensitive**
- Two resources with different URIs are considered **different entities**, regardless of shared labels
- Prefixes (e.g., `skos:`, `rdf:`, `rdfs:`) are shorthand for URI namespaces and must be declared
- RDF supports **any URI scheme** — both HTTP(S) URLs and URNs are perfectly acceptable identifiers

### 3.1 HTTP(S) URLs
- The most common form of URI in RDF and SKOS
- **Should** be stable and dereferenceable (Linked Data principles)
- Dereferenceability allows tooling to fetch metadata about the resource at its URI
- Example: `<https://example.org/concept/dog>`

### 3.2 URNs (Uniform Resource Names)
- URNs are a subset of URIs with the scheme `urn:` — they are **fully valid** in RDF
- URNs identify resources by **name** rather than **location** — they are **not dereferenceable**
- This makes them appropriate when a resource has a stable identity but no web presence
- URNs follow the format: `urn:<NID>:<NSS>`
  - `NID` — Namespace Identifier (registered with IANA, e.g., `isbn`, `uuid`, `ietf`)
  - `NSS` — Namespace Specific String (format defined per NID)

#### Common URN Namespaces

| Namespace | Format | Example |
|---|---|---|
| `urn:uuid:` | UUID v4 (random) or v5 (name-based) | `urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479` |
| `urn:isbn:` | International Standard Book Number | `urn:isbn:9780140449136` |
| `urn:ietf:` | IETF documents and RFCs | `urn:ietf:rfc:2141` |
| `urn:lex:` | Legal documents (EU, national law) | `urn:lex:eu:council:directive:2010-03-09;2010-19-UE` |
| `urn:example:` | Reserved for examples and documentation | `urn:example:concept:dog` |

#### URN Rules
- URN comparisons are **case-insensitive** for the `urn:` scheme prefix and NID, but **case-sensitive** for the NSS — follow the rules of the specific namespace
- URNs **must** use a registered NID or a well-known informal namespace (e.g., `urn:example:` for documentation)
- URNs **cannot** contain spaces or unencoded special characters
- A URN identifies the **same resource** regardless of where or how it is accessed
- URNs do **not** imply any network location and will not resolve in a browser

#### URNs in SKOS
- URNs are valid identifiers for `skos:Concept` and `skos:ConceptScheme`
- They are well-suited for **closed or internal vocabularies** that do not need to be published on the web
- They are commonly used with **UUID-based identifiers** for system-generated concepts:
  ```turtle
  <urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479> a skos:Concept ;
      skos:prefLabel "Dog"@en ;
      skos:inScheme <urn:uuid:a1b2c3d4-e5f6-7890-abcd-ef1234567890> .
  ```
- The trade-off vs. HTTP URIs: URNs sacrifice **discoverability and dereferenceability** in exchange for **location-independence and stability**

### 3.3 URI vs. URN — Comparison

| Property | HTTP(S) URL | URN |
|---|---|---|
| Valid in RDF | ✅ Yes | ✅ Yes |
| Dereferenceable | ✅ Yes (ideally) | ❌ No |
| Location-independent | ❌ No | ✅ Yes |
| Requires web infrastructure | ✅ Yes | ❌ No |
| Human-readable | ✅ Often | ⚠️ Depends on NID |
| Suitable for public Linked Data | ✅ Preferred | ⚠️ Possible but limited |
| Suitable for internal/closed systems | ✅ Yes | ✅ Yes |

---

## 4. Literal Rules

### 4.1 Types of Literals
| Type | Example | Usage |
|---|---|---|
| Plain literal | `"Dog"` | Simple string, no type |
| Language-tagged literal | `"Dog"@en` | String with language tag |
| Typed literal | `"2024"^^xsd:integer` | String with datatype URI |

### 4.2 Literal Equality
- Two literals are equal only if their **string value**, **language tag**, and **datatype** all match
- `"Dog"@en` ≠ `"Dog"@fr` ≠ `"Dog"` (no tag)

### 4.3 Literal Constraints
- Literals **cannot** appear as subjects or predicates
- Language tags follow **BCP 47** format (e.g., `en`, `fr`, `nl`, `zh-Hans`)

### 4.4 Relation to SKOS
- `skos:prefLabel`, `skos:altLabel`, `skos:hiddenLabel` must be **plain or language-tagged literals** — not typed literals, not URIs
- `skos:definition`, `skos:scopeNote`, and other note properties must also be **plain literals**
- Typed literals (e.g., `xsd:integer`) are **not appropriate** for SKOS label or note properties

---

## 5. Blank Node Rules

- A blank node is a resource with **no URI** — it has only a local, document-scoped identifier
- Blank nodes **cannot** be referenced from outside the document
- Two blank nodes in different documents are **never the same**, even if structurally identical
- Blank nodes are useful for anonymous intermediate structures but **not** for entities that need global identity

### 5.1 Relation to SKOS
- Blank nodes are technically permitted by RDF for `skos:Concept` and `skos:ConceptScheme`
- They are **strongly discouraged** in SKOS because concepts and schemes require globally referenceable URIs
- Using blank nodes for concepts breaks interoperability and cross-vocabulary linking

---

## 6. RDF Typing Rules

- `rdf:type` declares the class of a resource (shorthand: `a` in Turtle)
- A resource **can have multiple types** simultaneously — RDF is not exclusive
- Example: a resource can be both `skos:Concept` and `owl:Class` (though unusual)

### 6.1 Open World Assumption
- RDF makes **no closed-world assumption**
- The absence of a triple does not mean the statement is false — it simply means it is unknown
- This is fundamentally different from relational databases, which assume a closed world

### 6.2 Relation to SKOS
- SKOS adds **disjointness constraints** on top of the open world: `skos:Concept`, `skos:ConceptScheme`, and `skos:Collection` are declared mutually disjoint
- These constraints must be explicitly enforced by a validator — RDF alone will not catch them

---

## 7. RDFS Rules (RDF Schema)

RDFS is a vocabulary built on RDF that adds class and property semantics.

### 7.1 Class Hierarchy
- `rdfs:subClassOf` — declares that one class is a subclass of another (inheritance)
- `rdfs:subPropertyOf` — declares that one property is a sub-property of another

### 7.2 Domain and Range
- `rdfs:domain` — specifies the class of the **subject** of a property
- `rdfs:range` — specifies the class or datatype of the **object** of a property
- Violations of domain/range are not errors in RDF — they trigger **implicit type inference** instead

### 7.3 Annotation Properties
- `rdfs:label` — human-readable name for any resource (complementary to `skos:prefLabel`)
- `rdfs:comment` — human-readable description of any resource (complementary to `skos:definition`)

### 7.4 Relation to SKOS
- SKOS properties have declared `rdfs:domain` and `rdfs:range` in the SKOS ontology
- Example: `skos:prefLabel` has `rdfs:range rdfs:Literal` — confirming labels must be literals
- Example: `skos:inScheme` has `rdfs:range skos:ConceptScheme`
- SKOS classes are defined using `rdfs:subClassOf` and `rdf:type rdfs:Class`
- `rdfs:label` and `skos:prefLabel` can coexist on the same resource but serve different audiences (generic RDF tooling vs. SKOS-aware tooling)

---

## 8. Named Graphs & RDF Datasets

- A single RDF **graph** is a set of triples
- An RDF **dataset** is a collection of named graphs plus one default graph
- Named graphs are identified by a URI and allow grouping or provenance tracking of triples
- Serialization formats that support named graphs: **TriG**, **N-Quads**, **JSON-LD**
- Formats that support only a single graph: **Turtle**, **RDF/XML**, **N-Triples**

### 8.1 Relation to SKOS
- SKOS files are typically serialized as a **single default graph** (Turtle or RDF/XML)
- Multiple SKOS schemes can coexist in one graph — the graph boundary does not define scheme scope
- Named graphs can be used to track **provenance** (who created which triples, when) around SKOS data but this is outside the SKOS specification itself

---

## 9. RDF Serialization Formats

| Format | Extension | Graphs | Human-readable | Common use |
|---|---|---|---|---|
| Turtle | `.ttl` | Single | ✅ Yes | Authoring, most common for SKOS |
| RDF/XML | `.rdf` | Single | ⚠️ Verbose | Legacy, interoperability |
| JSON-LD | `.jsonld` | Multiple | ✅ Yes | Web APIs, Linked Data |
| N-Triples | `.nt` | Single | ❌ No | Streaming, bulk processing |
| TriG | `.trig` | Multiple | ✅ Yes | Named graphs |
| N-Quads | `.nq` | Multiple | ❌ No | Bulk named graph processing |

---

## 10. RDF Rules vs. SKOS Rules — Relation Map

| Concern | Governed by | Rule |
|---|---|---|
| Triple structure (S, P, O) | RDF | Subjects/predicates must be URIs or blank nodes |
| Literals as subjects | RDF | ❌ Not allowed |
| Multiple types on one resource | RDF | ✅ Allowed (open world) |
| Disjoint classes | SKOS (on top of RDF) | `skos:Concept`, `skos:ConceptScheme`, `skos:Collection` are mutually disjoint |
| Label values must be literals | RDFS (`rdfs:range rdfs:Literal`) + SKOS | Enforced by SKOS integrity conditions |
| Blank nodes for concepts | RDF allows, SKOS discourages | Use URIs for all named entities |
| Cyclic hierarchies | SKOS (not RDF) | RDF has no notion of hierarchy — SKOS forbids cycles in `skos:broader` |
| Scheme has no parent | SKOS (not RDF) | RDF has no container model — schemes are just typed resources |
| Language tags on labels | RDF literals (BCP 47) | One `skos:prefLabel` per language per concept |
| Cross-scheme linking | SKOS mapping properties | `skos:exactMatch`, `skos:broadMatch`, etc. |
| Named graphs / provenance | RDF Datasets | Outside SKOS scope, but compatible |

---

## 11. References

- [RDF 1.1 Concepts — W3C](https://www.w3.org/TR/rdf11-concepts/)
- [RDF Schema 1.1 — W3C](https://www.w3.org/TR/rdf-schema/)
- [Turtle Syntax — W3C](https://www.w3.org/TR/turtle/)
- [JSON-LD 1.1 — W3C](https://www.w3.org/TR/json-ld11/)
- [RDF 1.1 Datasets — W3C](https://www.w3.org/TR/rdf11-datasets/)
- [SKOS Reference — W3C](https://www.w3.org/TR/skos-reference/)
- [BCP 47 Language Tags](https://www.rfc-editor.org/rfc/bcp/bcp47.txt)
