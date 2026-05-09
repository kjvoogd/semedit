## Why

The navigation tree is currently read-only. Users need to be able to grow the tree interactively by adding child nodes, and the session state must survive a page refresh so work is not lost within a browsing session.

## What Changes

- Ctrl+click on any tree node triggers an inline "add child" action
- A new editable child node is inserted with the default label `--value--`
- Node labels are constrained to two lines maximum; overflow is truncated with `..` and revealed in a tooltip on hover
- The full tree state (including newly added nodes) is persisted to `sessionStorage` and restored on reload

## Capabilities

### New Capabilities
- `tree-node-authoring`: Adding editable child nodes to the tree via Ctrl+click, with inline editing and a `--value--` default

### Modified Capabilities
- `tree-navigation`: Requirements change to cover label truncation (2-line max, `..` suffix), truncation tooltip (black/white), and session persistence of tree state

## Impact

- `src/app-components/TreeNode.tsx` — add Ctrl+click handler, inline edit mode, truncation, tooltip
- `src/app-components/TreeNode.module.css` — two-line clamp, tooltip styles
- `src/hooks/useTreeData.ts` — add `addNode` mutation, sessionStorage save/restore
- `src/types/tree.ts` — no interface changes needed
