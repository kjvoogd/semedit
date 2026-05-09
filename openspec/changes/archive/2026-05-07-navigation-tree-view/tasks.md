## 1. Types and Data Model

- [x] 1.1 Create `src/types/tree.ts` defining the `TreeItem` interface (`id`, `label`, `children?`)

## 2. useTreeData Hook

- [x] 2.1 Create `src/hooks/useTreeData.ts` that accepts a `url` string, fetches on mount, and returns `{ data, loading, error, removeNode }`
- [x] 2.2 Implement `removeNode(id: string)` in the hook — filters the node and its subtree from state

## 3. TreeNode Component

- [x] 3.1 Create `src/app-components/TreeNode.tsx` with local `isOpen` state, renders label, +/− control (only when children exist), and × control
- [x] 3.2 Add recursive rendering of `children` using `TreeNode` when the node is expanded
- [x] 3.3 Create `src/app-components/TreeNode.module.css` with styles for the node row, controls, and the `max-height` CSS transition for the children container

## 4. Navigation Component

- [x] 4.1 Rewrite `src/app-components/Navigation.tsx` to use `useTreeData('/api/tree')` and render loading/error states
- [x] 4.2 Map top-level `data` items to `<TreeNode>` components, passing `onRemove` down
- [x] 4.3 Create `src/app-components/Navigation.module.css` for the navigation panel layout

## 5. Header Component

- [x] 5.1 Create `src/app-components/Header.module.css` with `width: 100%` and `box-sizing: border-box` styles
- [x] 5.2 Update `src/app-components/Header.tsx` to apply the CSS module class

## 6. Verification

- [x] 6.1 Run `pnpm type-check` and fix any TypeScript errors
- [x] 6.2 Start `pnpm dev` and verify the tree renders, expands/collapses with animation, and nodes can be removed
