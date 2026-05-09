## 1. Dependency setup

- [x] 1.1 Run `pnpm add n3` to install the N3.js Turtle parser
- [x] 1.2 Run `pnpm add -D @types/n3` to add TypeScript types for n3

## 2. Hook — loadTree

- [x] 2.1 Add `loadTree(items: TreeItem[]) => void` to `useTreeData` that replaces the tree state with the given items and calls `persist`
- [x] 2.2 Export `loadTree` from `useTreeData`

## 3. Lift useTreeData to App.tsx

- [x] 3.1 Move the `useTreeData('/api/tree')` call from `Navigation.tsx` to `App.tsx`; destructure `data`, `loading`, `error`, `removeNode`, `addNode`, `renameNode`, `moveNode`, `loadTree` in App
- [x] 3.2 Update `NavigationProps` to accept all tree data and mutation props instead of calling the hook internally; remove the hook call from `Navigation.tsx`
- [x] 3.3 Pass all tree props from `App.tsx` down to `<Navigation>`
- [x] 3.4 Add an `onImport: (file: File) => Promise<void>` prop to `Header`; pass a handler from `App.tsx`
- [x] 3.5 Run `pnpm type-check` after the refactor to confirm no prop-type errors

## 4. Turtle parser module

- [x] 4.1 Create `src/lib/parseTurtle.ts` with a function `parseTurtle(ttlText: string): TreeItem[]` that uses `n3.Parser` to parse the Turtle string into quads
- [x] 4.2 Collect all subjects with `rdf:type skos:Concept` from the parsed quads
- [x] 4.3 Determine root concepts: those referenced by `skos:hasTopConcept` OR those with no `skos:broader` triple
- [x] 4.4 Build node labels: use the first `skos:prefLabel` literal (prefer `@en`; fall back to any language or plain literal); if none, use the URI's local name (fragment or last path segment)
- [x] 4.5 Build children recursively using `skos:narrower` triples; fall back to inverse `skos:broader` if `skos:narrower` is absent; track visited URIs to prevent infinite loops on cycles
- [x] 4.6 Assign `TreeItem.id` as the full concept URI string
- [x] 4.7 Throw a descriptive `Error` if the input is not valid Turtle (propagate n3 parse errors)
- [x] 4.8 Throw an `Error` with message `"No SKOS concepts found"` if parsing succeeds but yields no concepts

## 5. App.tsx — import handler

- [x] 5.1 In `App.tsx`, implement `handleImport(file: File): Promise<void>`: read the file as text, call `parseTurtle`, call `loadTree` with the result, and clear any import error state
- [x] 5.2 On error from `parseTurtle`, set an `importError: string | null` state in `App.tsx` and pass it as a prop to `Header` for display
- [x] 5.3 Clear `importError` when a subsequent import succeeds

## 6. Header UI

- [x] 6.1 Add a hidden `<input type="file" accept=".ttl" ref={fileInputRef}>` and a visible "Import" link-style button to `Header.tsx`; clicking the button calls `fileInputRef.current?.click()`
- [x] 6.2 In the file-input `onChange` handler, call `onImport(file)` with the selected file and reset the input value so the same file can be re-imported
- [x] 6.3 If `importError` prop is non-null, display it as a short inline error message next to the Import link
- [x] 6.4 Update `Header.module.css`: add `.headerInner` flex row with `justify-content: space-between`; add `.importLink` style (monospace, 12px, `#aaa` colour, underline on hover, no background); add `.importError` style (`color: #f66; font-size: 11px; margin-left: 6px`)

## 7. Verification

- [x] 7.1 Run `pnpm type-check` and fix any errors
- [x] 7.2 Verify: "Import" link is visible on the right side of the header at all times
- [x] 7.3 Verify: clicking "Import" opens the OS file picker filtered to `.ttl` files
- [x] 7.4 Verify: importing a valid Turtle file with SKOS concepts replaces the tree correctly
- [x] 7.5 Verify: `skos:prefLabel` is used as the node label; URI local name is used as fallback
- [x] 7.6 Verify: `skos:narrower` hierarchy is reflected in parent–child nesting
- [x] 7.7 Verify: importing a non-Turtle file shows an inline error and leaves the tree unchanged
- [x] 7.8 Verify: importing a valid Turtle file with no `skos:Concept` triples shows "No SKOS concepts found"
- [x] 7.9 Verify: imported tree persists across a page reload
