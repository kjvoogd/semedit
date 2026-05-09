## Why

The tree navigation panel supports adding and removing nodes but lacks drag-and-drop reordering, reparenting, and a safety confirmation before deletion. Without these, restructuring a tree requires deleting and re-adding nodes, and deletions are instant and irreversible.

## What Changes

- Drag-and-drop reordering: users can drag a node to a new position within its current parent.
- Reparenting via drag: users can drag a node onto another node to move it there as a child.
- Delete confirmation: the × button triggers the same inline Yes/No confirmation pattern used for new-node authoring instead of immediately removing the node.

## Capabilities

### New Capabilities

- `tree-dnd`: Drag-and-drop reorder and reparent of tree nodes, with visual drop indicators and sessionStorage persistence on drop.

### Modified Capabilities

- `tree-node-authoring`: The × (remove) button now shows an inline confirmation before deleting, using the same Keep/Discard UI pattern introduced for new node authoring.

## Impact

- `src/app-components/TreeNode.tsx` — drag event handlers, drop-target highlighting, updated remove flow
- `src/app-components/TreeNode.module.css` — drag styles, drop-indicator styles
- `src/hooks/useTreeData.ts` — `moveNode(id, newParentId, index)` mutation for reparenting/reorder, persist on drop
- `openspec/specs/tree-node-authoring/spec.md` — delta spec adding delete confirmation requirement
