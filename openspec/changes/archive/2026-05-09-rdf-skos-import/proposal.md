## Why

Semedit is built for editing RDF and SKOS files, but currently only supports a hard-coded mock tree. Users need to load real SKOS concept schemes from Turtle files so the navigation tree reflects actual data.

## What Changes

- An "Import" link on the right side of the header allows the user to choose a `.ttl` file from disk.
- The Turtle file is parsed in the browser using a pure-JS library.
- SKOS concepts are extracted: `skos:prefLabel` becomes the node label, `skos:narrower` / `skos:broader` relationships determine parent–child structure.
- The resulting `TreeItem[]` replaces the current tree (sessionStorage is updated).
- If parsing fails or the file contains no recognisable SKOS concepts, a clear error message is shown inline.

## Capabilities

### New Capabilities

- `rdf-skos-import`: A UI control and parsing pipeline that lets the user load a Turtle file and populate the navigation tree from SKOS ConceptScheme data.

### Modified Capabilities

_(none — no existing requirements change)_

## Impact

- `src/App.tsx` — `useTreeData` lifted here; passes tree props to Navigation and `onImport` callback to Header
- `src/app-components/Header.tsx` / `Header.module.css` — "Import" link on the right side with hidden file input
- `src/app-components/Navigation.tsx` — receives tree data and mutations as props instead of owning the hook
- New module `src/lib/parseTurtle.ts` — wraps an RDF/Turtle parser, extracts SKOS hierarchy into `TreeItem[]`
- `package.json` / `pnpm-lock.yaml` — adds a Turtle/RDF parsing dependency (e.g. `n3`)
- `src/hooks/useTreeData.ts` — adds `loadTree` to allow replacing the tree from outside the fetch flow
