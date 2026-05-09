## Context

Semedit currently populates the navigation tree from a mock REST endpoint (`/api/tree`). The tree is a `TreeItem[]` managed by `useTreeData`, persisted to sessionStorage. There is no mechanism to load external files. The app runs entirely in the browser (Vite + React), so file I/O must use the browser File API; no server-side parsing is involved.

## Goals / Non-Goals

**Goals:**
- Let a user pick a `.ttl` (Turtle) file from disk via a file-input control in the navigation panel
- Parse the Turtle in-browser, extract SKOS concepts, and replace the current tree
- Map `skos:narrower` / `skos:broader` to parent–child, `skos:prefLabel` (language-tagged or plain) to node label
- Persist the imported tree to sessionStorage (same as other mutations)
- Show an inline error if the file cannot be parsed or yields no concepts

**Non-Goals:**
- RDF/XML, JSON-LD, N-Triples, or any format other than Turtle
- Export / serialisation back to Turtle
- Merging an imported file with the existing tree (import always replaces)
- Server-side validation or storage
- Multi-file import

## Decisions

### 1. Turtle parsing library: `n3` vs. manual parser

**Decision:** Use the [`n3`](https://github.com/rdfjs/N3.js) library (`n3` on npm).

**Rationale:** `n3` is the de-facto browser-compatible Turtle parser for JavaScript. It is pure JS, works in Vite without Node polyfills, and supports streaming. The bundle impact (~100 kB minified) is acceptable for a desktop editing tool.

**Alternative considered:** `rdflib.js` — larger (~500 kB), older API, harder to tree-shake.

### 2. SKOS hierarchy extraction strategy

**Decision:** Build the tree top-down from `skos:ConceptScheme` (or top concepts) using `skos:narrower`.

Algorithm:
1. Collect all subjects that are `rdf:type skos:Concept`.
2. Find root concepts: those that appear in `skos:hasTopConcept` triples OR have no `skos:broader`.
3. Recursively build children via `skos:narrower` (falling back to inverse `skos:broader` if `skos:narrower` is absent).
4. Node label = first `skos:prefLabel` found (prefer `@en`, fall back to any language or plain literal).
5. Node id = the concept URI (slugified as a string for `TreeItem.id`).

**Alternative considered:** Using only `skos:broader` bottom-up — requires a separate root-detection pass and is more complex with cycles. `skos:narrower` top-down is cleaner.

### 3. Where import lives: lift hook to App.tsx

**Decision:** Move `useTreeData` from `Navigation.tsx` to `App.tsx`. App passes tree data and mutations as props to `Navigation`, and passes an `onImport(file: File) => void` callback to `Header`. `Header` owns the file-input UI; `App` owns the `parseTurtle` call and `loadTree` invocation.

**Rationale:** The import trigger lives in the Header, but the tree state lives in Navigation. The only clean way to share state without a context or global store is to lift it to their common ancestor (`App.tsx`). The parsing logic stays in `src/lib/parseTurtle.ts` (standalone, testable). `Navigation` becomes a presentational component driven by props.

### 4. File-picker placement

**Decision:** An "Import" link-style button on the right side of the header bar, implemented as a hidden `<input type="file" accept=".ttl">` triggered by a visible `<button>` (or `<a>` styled as a link).

**Rationale:** The header is always visible and is the natural home for application-level actions. Placing import there separates it visually from per-node tree controls.

## Risks / Trade-offs

- [Large Turtle files] Parsing a very large file on the main thread may briefly block the UI. → Mitigation: use `n3`'s async `Parser.parse()` with a callback; consider a Web Worker in a future iteration.
- [Missing prefLabel] Concepts without a `skos:prefLabel` will fall back to the URI, which may be verbose. → Mitigation: use the URI's local name (fragment or last path segment) as the label fallback.
- [Cycles in skos:narrower] A malformed file with cyclic `skos:narrower` would infinite-loop. → Mitigation: track visited URIs during recursion and skip already-seen nodes.
- [n3 bundle size] Adds ~100 kB to the bundle. → Acceptable for a desktop editing tool; can be lazy-loaded in a future iteration.
