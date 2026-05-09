## Context

The app has a working React scaffold (Header, Navigation, MainBody, Footer) but all components show placeholder text. The Navigation slot needs a real collapsible tree driven by a REST service, and the Header needs to span the full viewport width. No external UI library is in use; styling is currently unstyled.

## Goals / Non-Goals

**Goals:**
- Header renders as a full-width bar across the top of the page
- Navigation renders a recursive, collapsible tree fetched from a configurable REST endpoint
- Tree nodes show +/− to expand/collapse and × to remove a node
- Expand/collapse uses a CSS transition animation (smooth height change)
- Custom TypeScript implementation — no third-party tree library
- Styles via CSS Modules scoped to each component

**Non-Goals:**
- Drag-and-drop reordering
- Node editing (rename, add child)
- Persisting removals back to the server
- Authentication for the REST endpoint
- Accessibility beyond semantic HTML

## Decisions

**Recursive `TreeNode` component** — A single `TreeNode.tsx` renders itself and maps over its `children` prop, calling `TreeNode` recursively. This keeps the component surface small and handles arbitrary depth naturally. Alternative (flat list + parent-id lookup) adds unnecessary complexity for a tree of unknown depth.

**`useTreeData` hook** — Owns the `fetch`, loading/error state, and the mutable tree array (for node removal). Keeps `Navigation.tsx` as a thin consumer. The hook accepts a `url` prop so the endpoint is configurable without changing component code.

**Tree node data shape:**
```ts
interface TreeItem {
  id: string;
  label: string;
  children?: TreeItem[];
}
```
The REST service is expected to return `TreeItem[]` at the top level. No transformation layer needed unless the API shape differs.

**CSS `max-height` transition for animation** — Setting `max-height: 0` → `max-height: 1000px` with `overflow: hidden` and `transition` gives a smooth accordion-style open/close without needing JS measurement of element height. Alternative (JS-measured height) is more precise but significantly more code for this use case.

**CSS Modules** — Each component gets a `.module.css` file. Vite supports CSS Modules out of the box; no additional config needed. Alternative (Tailwind) was considered but the user requested a custom implementation, and CSS Modules keep styling close to the component without a build step change.

**Expand/collapse state is local** — Each `TreeNode` manages its own `isOpen` state with `useState`. This avoids prop-drilling and is sufficient since there is no requirement to control tree state externally.

## Risks / Trade-offs

- **REST endpoint URL is unknown** → `useTreeData` will accept a `url` prop; `Navigation.tsx` will default to a placeholder constant (`/api/tree`). The constant can be changed or made an env var in a follow-up.
- **`max-height` animation** → The transition looks slightly uneven on very deep subtrees because `max-height: 1000px` is an arbitrary cap. If subtrees exceed ~40 items the close animation will feel fast. Mitigation: the cap can be raised or replaced with a JS-measured approach later.
- **CORS** → If the REST endpoint is on a different origin, browser CORS policy will block the fetch. Mitigation: document that the endpoint must include `Access-Control-Allow-Origin` headers or be proxied via Vite's `server.proxy`.
