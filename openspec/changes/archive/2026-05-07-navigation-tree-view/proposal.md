## Why

The app has a Navigation component that currently renders placeholder text. It needs a real tree-structured navigation fed by a REST service so users can browse hierarchical RDF/SKOS data. The Header also needs full-width styling so the layout feels intentional rather than unstyled.

## What Changes

- **BREAKING (visual)**: `Header` no longer renders plain text — it becomes a styled full-width bar
- `Navigation` is replaced with a collapsible tree component that fetches its data from a configurable REST endpoint returning JSON
- Tree nodes support expand/collapse via +/− controls and animated transitions
- Tree nodes support removal via an × control
- New `useTreeData` hook encapsulates the REST fetch and tree state
- CSS Modules added for scoped component styles

## Capabilities

### New Capabilities
- `tree-navigation`: Collapsible tree rendered in the Navigation slot, driven by JSON from a REST endpoint, with +/−/× controls and CSS transition animations

### Modified Capabilities
- `app-layout`: Header requirement changes from plain text to a full-width styled bar

## Impact

- `src/app-components/Header.tsx` — add full-width CSS
- `src/app-components/Navigation.tsx` — replaced with tree component
- New files: `src/app-components/TreeNode.tsx`, `src/hooks/useTreeData.ts`, CSS module files
- `package.json` — no new runtime dependencies (custom implementation)
