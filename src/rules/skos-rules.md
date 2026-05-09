# SKOS Structural Rules

## 1. Core Entities

| Entity | Type | Description |
|---|---|---|
| `skos:ConceptScheme` | Root-level resource | A vocabulary or knowledge organization system |
| `skos:Concept` | Named resource | A unit of knowledge / idea within a scheme |
| `skos:Collection` | Named resource | An unordered grouping of concepts |
| `skos:OrderedCollection` | Named resource | An ordered grouping of concepts |

---

## 2. ConceptScheme Rules

### 2.1 Multiple Schemes
- A SKOS file **may contain multiple** `skos:ConceptScheme` instances.
- Each scheme is identified by a **unique URI**.
- Schemes are **root-level, peer entities** — they have no parent.
- The RDF graph itself is a flat set of triples and imposes no container or root node above schemes.
- Every `skos:ConceptScheme` **should** have at least one `skos:prefLabel`.
- Every `skos:ConceptScheme` **should** declare at least one `skos:hasTopConcept`.

### 2.2 Nesting Schemes
- A `skos:ConceptScheme` **cannot** contain another `skos:ConceptScheme` as a child.
- There is **no SKOS property** to nest or subordinate one scheme inside another.
- Any nesting of schemes requires custom/non-standard properties outside the SKOS specification (e.g., via OWL or RDFS), which breaks spec conformance.

### 2.3 Allowed Workarounds for Sub-grouping
| Approach | Within SKOS spec? | Notes |
|---|---|---|
| `skos:Collection` | ✅ Yes | Groups concepts within a scheme |
| Multiple flat schemes | ✅ Yes | Link via mapping relations |
| Custom `isSubSchemeOf` property | ❌ No | Non-standard, OWL/RDFS extension |
| XKOS extension | ⚠️ Extension | Richer structure, outside core SKOS |

---

## 3. Concept Rules

### 3.1 Scheme Membership
- A `skos:Concept` **must** be linked to a scheme via `skos:inScheme`.
- A concept **may belong to multiple schemes** simultaneously via multiple `skos:inScheme` statements.
- `skos:topConceptOf` marks a concept as a root concept within a scheme (implies `skos:inScheme`).
- Every `skos:Concept` **should** have at least one `skos:prefLabel`.
- Every `skos:Concept` **should** have a `skos:definition` for unambiguous semantics.

### 3.2 Hierarchical Relations
- `skos:broader` — links a concept to a more general concept (parent).
- `skos:narrower` — links a concept to a more specific concept (child).
- `skos:broader` and `skos:narrower` are **inverse properties**: if A `skos:broader` B, then B `skos:narrower` A.
- Hierarchical relations **must stay within the same scheme** in conformant usage.
- Transitive variants: `skos:broaderTransitive`, `skos:narrowerTransitive`.
- **No cyclic hierarchies** — a concept cannot be its own broader or narrower ancestor (directly or transitively).

### 3.3 Associative Relations
- `skos:related` — non-hierarchical link between two concepts.
- `skos:related` is **symmetric**: if A `skos:related` B, then B `skos:related` A.
- A concept **cannot** be both `skos:broader` and `skos:related` to the same concept (disjoint by spec).

### 3.4 Labels
- Each concept **should** have exactly **one** `skos:prefLabel` per language tag.
- Multiple `skos:altLabel` values per language are allowed.
- `skos:prefLabel` and `skos:altLabel` **must not share the same literal** for the same language on the same concept.
- Two concepts in the same scheme **should not** share the same `skos:prefLabel` for the same language (S14 integrity condition).
- A `skos:prefLabel` of one concept **should not** be an `skos:altLabel` of another concept in the same scheme.
- `skos:prefLabel`, `skos:altLabel`, and `skos:hiddenLabel` must be **plain literals** (with or without language tags) — not URIs.

### 3.5 Notes & Documentation
- Note properties (`skos:definition`, `skos:scopeNote`, `skos:example`, `skos:historyNote`, `skos:editorialNote`, `skos:changeNote`) should be **plain literals**.
- Notes are **not** formally structured — they carry human-readable text only.

---

## 4. Disjointness & Type Rules

- A resource **cannot** be both a `skos:Concept` and a `skos:ConceptScheme` simultaneously.
- A resource **cannot** be both a `skos:Concept` and a `skos:Collection`.
- A resource **cannot** be both a `skos:ConceptScheme` and a `skos:Collection`.
- These three classes are **mutually disjoint** by the SKOS specification.

---

## 5. Mapping Relations (Cross-Scheme)

Used to relate concepts **across different schemes**:

| Property | Meaning | Symmetric? | Transitive? |
|---|---|---|---|
| `skos:exactMatch` | Concepts are interchangeable in all contexts | ✅ Yes | ✅ Yes |
| `skos:closeMatch` | Concepts are sufficiently similar for some purposes | ✅ Yes | ❌ No |
| `skos:broadMatch` | The mapped concept is broader (more general) | ❌ No | ❌ No |
| `skos:narrowMatch` | The mapped concept is narrower (more specific) | ❌ No | ❌ No |
| `skos:relatedMatch` | Associative mapping between concepts in different schemes | ✅ Yes | ❌ No |

- Mapping relations **should not** be used between concepts within the same scheme (use `skos:broader`/`skos:related` instead).
- `skos:exactMatch` **should not** be combined with `skos:broadMatch` or `skos:narrowMatch` for the same pair of concepts.
- `skos:exactMatch` is transitive — use with care to avoid unintended equivalence chains.
- `skos:broadMatch` and `skos:narrowMatch` are **inverse** of each other.

---

## 6. Collection Rules

- A `skos:Collection` groups concepts but is **not** a `skos:Concept` itself.
- Collections are **not** linked via `skos:broader`/`skos:narrower`.
- Members are linked via `skos:member`.
- `skos:OrderedCollection` uses `skos:memberList` (an RDF list) for ordered members.
- Collections **may be nested** (a collection can contain another collection via `skos:member`).
- A `skos:ConceptScheme` **cannot** be a member of a collection.

---

## 7. URI & Identity Rules

- Every `skos:Concept` and `skos:ConceptScheme` **must** have a unique, stable URI.
- URIs **should** be dereferenceable (following Linked Data principles).
- **Blank nodes** are technically permitted by RDF but **strongly discouraged** for concepts and schemes, as they cannot be referenced externally.
- Two resources with different URIs are considered **different entities**, even if they share the same label.

---

## 8. Summary of What Is and Is Not Allowed

| Rule | Allowed? |
|---|---|
| Multiple `skos:ConceptScheme` in one file | ✅ Yes |
| `skos:ConceptScheme` nested inside another | ❌ No |
| A concept in multiple schemes | ✅ Yes |
| Hierarchical relations between schemes | ❌ No |
| Mapping relations within the same scheme | ⚠️ Discouraged |
| `skos:Collection` inside a scheme | ✅ Yes |
| `skos:Collection` nested inside another collection | ✅ Yes |
| `skos:ConceptScheme` as member of a collection | ❌ No |
| A resource typed as both `skos:Concept` and `skos:ConceptScheme` | ❌ No |
| A resource typed as both `skos:Concept` and `skos:Collection` | ❌ No |
| Cyclic `skos:broader`/`skos:narrower` hierarchies | ❌ No |
| Multiple `skos:prefLabel` per language on one concept | ❌ No |
| Same literal as `skos:prefLabel` and `skos:altLabel` on one concept | ❌ No |
| Same `skos:prefLabel` shared by two concepts in the same scheme | ⚠️ Discouraged (S14) |
| `skos:broader` and `skos:related` on the same concept pair | ❌ No |
| `skos:exactMatch` combined with `skos:broadMatch` for same pair | ❌ No |
| Blank nodes for concepts or schemes | ⚠️ Discouraged |
| Labels as URIs (non-literals) | ❌ No |

---

## 9. References

- [SKOS Reference — W3C Recommendation](https://www.w3.org/TR/skos-reference/)
- [SKOS Primer — W3C](https://www.w3.org/TR/skos-primer/)
- [SKOS Integrity Conditions](https://www.w3.org/TR/skos-reference/#L4053)
- [SKOS Use Cases and Requirements](https://www.w3.org/TR/skos-ucr/)
