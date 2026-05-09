## Context

The navigation tree currently supports add and remove mutations; all changes persist to sessionStorage. There is no drag-and-drop, and clicking × instantly removes a node without confirmation. `TreeNode` is a recursive component; `useTreeData` owns all mutations and persistence.

## Goals / Non-Goals

**Goals:**
- Drag-and-drop reorder of nodes within their current parent
- Drag-and-drop reparenting of a node by dropping it onto another node
- Inline delete confirmation (Yes / No) before any × removal, reusing the same inline-confirmation visual pattern already used for new-node authoring
- Persist tree state to sessionStorage after every drop

**Non-Goals:**
- Multi-select drag
- Undo / redo
- Server-side persistence
- Drag-to-root (nodes can only be dropped onto an existing node, not to the top level)

## Decisions

### 1. Drag API: native HTML5 vs. library

**Decision:** Use the native HTML5 Drag and Drop API (`draggable`, `onDragStart`, `onDragOver`, `onDrop`, `onDragEnd`).

**Rationale:** The tree is simple (shallow depth, no virtualization). The native API is zero-dependency and sufficient for this use case.

**Alternative considered:** dnd-kit — more robust for complex use cases but adds ~30 kB and indirection for a tree that doesn't need it.

### 2. Drop indicator design

**Decision:**
- **Reorder (sibling insert):** show a horizontal blue line between nodes to indicate insertion position.
- **Reparent (move into):** highlight the target node row with a coloured border.

**Rationale:** Clear visual distinction between "insert between" and "move into" prevents user confusion. Both indicators are removed immediately after drop or drag-cancel.

**Implementation:** track `dropTarget: { id: string; position: 'before' | 'after' | 'into' } | null` in Navigation state. Pass it down as props to each TreeNode, which applies a CSS class accordingly.

### 3. moveNode signature

**Decision:** `moveNode(id: string, targetId: string, position: 'before' | 'after' | 'into'): void` in `useTreeData`.

- `'before'` / `'after'`: remove `id` from its current location, insert it before/after `targetId` in `targetId`'s parent.
- `'into'`: remove `id` from its current location, append it as the last child of `targetId`.

**Rationale:** A single function handles all three cases. Prevents dropping a node onto itself or onto one of its own descendants (guard required).

### 4. Delete confirmation state

**Decision:** Add a separate `deletingId: string | null` state in `Navigation.tsx`, independent of the existing `confirmingId` used for new-node authoring.

**Rationale:** The two confirmations differ in message ("Delete node?" vs "Keep node?") and in what triggers them. Keeping them separate avoids a mode flag and keeps each flow readable. Both reuse the same `confirmRow` / `keepBtn` / `discardBtn` CSS classes for visual consistency.

When `item.id === deletingId`, `TreeNode` renders the inline confirmation row with "Delete?" / Yes / No, replacing the normal label row. Yes calls `onRemove(item.id)`; No clears `deletingId`.

The × button no longer calls `onRemove` directly; it calls a new `onRequestDelete(id)` prop that sets `deletingId`.

## Risks / Trade-offs

- [HTML5 DnD on mobile] Native drag events don't fire on touch devices. → Mitigation: out of scope for now; touch support can be added later with pointer events.
- [Dropping onto a descendant] Moving a node into one of its own children would corrupt the tree. → Mitigation: `moveNode` guards against this by walking the ancestor chain before mutating.
- [Drag over collapsed nodes] If a target node is collapsed its children are not reachable by dragging. → Mitigation: auto-expand on hover after 600 ms (optional stretch goal; not required for MVP).
