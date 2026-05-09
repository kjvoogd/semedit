## 1. Hook — addNode and sessionStorage persistence

- [x] 1.1 Add `addNode(parentId: string, newNode: TreeItem) => void` to `useTreeData` that inserts `newNode` as the last child of the matching parent
- [x] 1.2 Add `persist(tree: TreeItem[]) => void` helper inside `useTreeData` that writes the tree to `sessionStorage` under key `semedit-tree` as JSON
- [x] 1.3 Call `persist` after every mutation (`removeNode`, `addNode`)
- [x] 1.4 On mount, check `sessionStorage` for `semedit-tree`; if present, use it as initial state and skip the network fetch

## 2. TreeNode — Ctrl+click and inline edit

- [x] 2.1 Add `onAddChild: (parentId: string) => void` prop to `TreeNode` and wire Ctrl+click on the node row to call it (prevent default and stop propagation)
- [x] 2.2 In `Navigation.tsx`, implement `handleAddChild(parentId)`: generate a `crypto.randomUUID()` id, call `addNode` with a `{ id, label: '--value--', children: [] }` node, then set an `editingId` state to that id
- [x] 2.3 Pass `editingId` and `onCommitEdit(id, label)` / `onCancelEdit(id)` down through `TreeNode` props
- [x] 2.4 When `item.id === editingId`, render an `<input>` (defaultValue `--value--`) instead of the label span; auto-focus it
- [x] 2.5 On Enter or blur: call `onCommitEdit(id, value || '--value--')` which renames the node label in hook state
- [x] 2.6 On Escape: call `onCancelEdit(id)` which calls `removeNode(id)` to discard the uncommitted node
- [x] 2.7 Add `renameNode(id: string, label: string) => void` to `useTreeData` for the commit step

## 3. TreeNode — two-line truncation with `..` and tooltip

- [x] 3.1 Add a `labelRef = useRef<HTMLSpanElement>(null)` and a `isTruncated` state to `TreeNode`
- [x] 3.2 After mount and on label change, use a `ResizeObserver` on `labelRef` to check `scrollHeight > clientHeight`; set `isTruncated` accordingly and disconnect the observer after first measurement
- [x] 3.3 When `isTruncated`, progressively trim the rendered label string (binary-search character count) until it fits in two lines, then append `..`
- [x] 3.4 Update `TreeNode.module.css`: set `.label` to `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden` as a base, override with the JS-truncated string when `isTruncated`
- [x] 3.5 Add `.tooltip` class to `TreeNode.module.css`: `position: absolute`, black background, white text, 1px solid white border, `z-index: 100`, hidden by default
- [x] 3.6 Render a tooltip `<div>` inside the node row when `isTruncated`, showing the full `item.label`; show/hide via `onMouseEnter`/`onMouseLeave` state

## 4. Verification

- [x] 4.1 Run `pnpm type-check` and fix any errors
- [x] 4.2 Verify: Ctrl+click adds child, Enter/blur commits, Escape cancels
- [x] 4.3 Verify: long labels truncate to 2 lines with `..`, tooltip shows full value on hover
- [x] 4.4 Verify: add a node, refresh the page, confirm the node is still present

## 5. Default-value confirmation and fixed nav width

- [x] 5.1 Add a `confirmingId` state to `Navigation.tsx` (similar to `editingId`); set it when `onCommitEdit` is called with the unchanged default `--value--` value
- [x] 5.2 Pass `confirmingId`, `onKeep(id)` and `onDiscard(id)` as props through `TreeNode`
- [x] 5.3 When `item.id === confirmingId`, render an inline confirmation row (`Keep` / `Discard` buttons) instead of the label
- [x] 5.4 `onKeep`: clear `confirmingId`, set `editingId` back to the node id so the input reappears with `--value--` selected
- [x] 5.5 `onDiscard`: call `removeNode(id)` and clear both `confirmingId` and `editingId`
- [x] 5.6 Add `.confirm` row styles to `TreeNode.module.css`: same row layout, `Keep` button green-tinted, `Discard` button red-tinted
- [x] 5.7 Fix `Navigation.module.css`: replace `min-width` with `width: 220px; flex-shrink: 0; overflow-x: hidden`
- [x] 5.8 Run `pnpm type-check` and verify all new flows work in the browser
