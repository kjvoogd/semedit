## 1. Delete confirmation

- [x] 1.1 Add `deletingId: string | null` state to `Navigation.tsx` alongside `confirmingId`
- [x] 1.2 Add `onRequestDelete: (id: string) => void` prop to `TreeNode`; change the × button to call `onRequestDelete(item.id)` instead of `onRemove(item.id)` directly
- [x] 1.3 In `Navigation.tsx`, implement `handleRequestDelete(id)`: set `deletingId(id)`
- [x] 1.4 In `Navigation.tsx`, implement `handleConfirmDelete(id)`: call `removeNode(id)`, clear `deletingId`
- [x] 1.5 In `Navigation.tsx`, implement `handleCancelDelete(id)`: clear `deletingId`
- [x] 1.6 Pass `deletingId`, `onConfirmDelete`, `onCancelDelete` as props through `TreeNode` (and recursively to child nodes)
- [x] 1.7 In `TreeNode`, when `item.id === deletingId`, render the same `confirmRow` inline confirmation UI with "Delete?" label, Yes (confirm) and No (cancel) buttons using `onMouseDown` + `e.preventDefault()` to avoid blur race conditions
- [x] 1.8 Apply `paddingLeft: 0` to the row when `deletingId` matches (same as `isConfirming`) so confirmation appears at the left edge
- [x] 1.9 Run `pnpm type-check` and verify the delete confirmation flow works end-to-end

## 2. Hook — moveNode

- [x] 2.1 Add helper `findAndRemove(tree: TreeItem[], id: string): [TreeItem[], TreeItem | null]` that removes the node with the given id and returns the updated tree and the removed node
- [x] 2.2 Add helper `insertNode(tree: TreeItem[], targetId: string, node: TreeItem, position: 'before' | 'after' | 'into'): TreeItem[]` that inserts `node` before/after/into the target node; guard against dropping a node onto itself or its own descendant (return tree unchanged)
- [x] 2.3 Add `moveNode(id: string, targetId: string, position: 'before' | 'after' | 'into') => void` to `useTreeData` that calls `findAndRemove` then `insertNode`, then calls `persist`
- [x] 2.4 Export `moveNode` from `useTreeData` and consume it in `Navigation.tsx`

## 3. Drag-and-drop — TreeNode

- [x] 3.1 Add `draggable={true}` to the `.row` div in `TreeNode`
- [x] 3.2 On `onDragStart`: call `e.dataTransfer.setData('text/plain', item.id)`; set opacity/dim style on the dragged row
- [x] 3.3 On `onDragEnd`: remove the dim style regardless of drop outcome
- [x] 3.4 Add `dropIndicator: { id: string; position: 'before' | 'after' | 'into' } | null` state to `Navigation.tsx`; pass `dropIndicator` as a prop to all `TreeNode` instances
- [x] 3.5 On `onDragOver` in `TreeNode`: call `e.preventDefault()`; determine position ('before', 'after', or 'into') based on cursor Y within the row (top 30% → 'before', bottom 30% → 'after', middle 40% → 'into'); call `onDropIndicatorChange({ id: item.id, position })` prop
- [x] 3.6 On `onDragLeave` in `TreeNode`: call `onDropIndicatorChange(null)` if the leave target is outside the node
- [x] 3.7 Apply CSS classes to the `.row` based on `dropIndicator`: `styles.dropBefore`, `styles.dropAfter`, `styles.dropInto`
- [x] 3.8 On `onDrop` in `TreeNode`: call `e.preventDefault()`; read the dragged id from `e.dataTransfer.getData('text/plain')`; call `onDrop(draggedId, item.id, position)` prop; clear `dropIndicator`

## 4. Drag-and-drop — Navigation wiring

- [x] 4.1 In `Navigation.tsx`, implement `handleDropIndicatorChange(indicator)`: set `dropIndicator` state
- [x] 4.2 In `Navigation.tsx`, implement `handleDrop(draggedId, targetId, position)`: call `moveNode(draggedId, targetId, position)`; clear `dropIndicator`; if `position === 'into'`, auto-expand the target node (pass an `expandId` prop or use a separate `expandedIds` state)
- [x] 4.3 Wire `onDropIndicatorChange` and `onDrop` through all `TreeNode` props and recursive child renders

## 5. Drop indicator styles

- [x] 5.1 Add `.dropBefore` to `TreeNode.module.css`: `box-shadow: 0 -2px 0 #4af` (blue line above the row)
- [x] 5.2 Add `.dropAfter` to `TreeNode.module.css`: `box-shadow: 0 2px 0 #4af` (blue line below the row)
- [x] 5.3 Add `.dropInto` to `TreeNode.module.css`: `outline: 1px solid #4af` (blue outline around the row)
- [x] 5.4 Add `.dragging` to `TreeNode.module.css`: `opacity: 0.4`

## 6. Auto-expand on reparent

- [x] 6.1 Add an `expandId: string | null` prop to `TreeNode`; when `item.id === expandId`, force `isOpen = true` via `useEffect`
- [x] 6.2 In `Navigation.tsx`, after a `'into'` drop, set `expandId` to `targetId` (clear it after one render cycle)

## 7. Verification

- [x] 7.1 Run `pnpm type-check` and fix any errors
- [x] 7.2 Verify: clicking × shows "Delete?" inline confirmation; Yes removes, No cancels
- [x] 7.3 Verify: dragging a node before/after a sibling reorders it correctly
- [x] 7.4 Verify: dragging a node onto another node reparents it as the last child
- [x] 7.5 Verify: cannot drag a node onto itself or one of its descendants
- [x] 7.6 Verify: drag-and-drop changes persist across page reload (sessionStorage)
