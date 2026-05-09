## Context

The navigation tree supports expand/collapse and node removal but is otherwise static. Users need to author new nodes interactively and have that work survive a page refresh within the same browser session.

## Goals / Non-Goals

**Goals:**
- Ctrl+click on any node inserts an editable child with default label `--value--`
- Inline edit field: Enter or blur commits the value; Escape cancels and removes the uncommitted node
- Node labels are capped at two rendered lines; overflow is truncated with `..` and the full value is shown in a styled tooltip
- Full tree state (initial fetch + all mutations) persists in `sessionStorage` under a fixed key and is restored on mount

**Non-Goals:**
- Renaming existing nodes (only newly-added nodes are editable)
- Drag-and-drop reordering
- Multi-select or bulk operations
- Persisting to the server

## Decisions

**Ctrl+click for add-child trigger** — Avoids colliding with normal click (expand/collapse) and right-click (OS context menu). It is a well-understood power-user pattern. The cursor changes to `pointer` on hover to hint interactivity, but no visual affordance is added until Ctrl is held (avoids clutter).

**`<input>` for inline edit, not `contentEditable`** — `<input>` gives controlled value handling, native keyboard events (`Enter`, `Escape`), and avoids the cross-browser inconsistencies of `contentEditable`. The input is auto-focused on insertion.

**JS-based two-line truncation with `..`** — CSS `-webkit-line-clamp` forces a `…` (ellipsis character) and cannot produce `..`. Instead, `TreeNode` will use a `useRef` + `ResizeObserver` approach: render the full text, measure `scrollHeight` vs `clientHeight`, and if overflowing replace with a progressively shortened string ending in `..`. The `isTruncated` flag is stored in component state and controls tooltip visibility. This keeps the DOM simple and avoids hidden overflow causing layout shifts.

**Tooltip as a positioned `<div>` sibling** — Rendered inside the node's relative-positioned container. `position: absolute; top: 100%` places it below the label. Black background, white text, 1px white border, `z-index` high enough to clear siblings. `title` attribute was rejected because it cannot be styled.

**`addNode(parentId, newNode)` added to `useTreeData`** — Consistent with the existing `removeNode` pattern. The hook owns all tree mutations and is the single place that writes to `sessionStorage`. Every mutation calls `persist(newTree)`.

**`sessionStorage` with key `semedit-tree`** — `sessionStorage` is tab-scoped and cleared when the tab closes, matching the "session-specific" requirement. On mount, `useTreeData` checks for a stored value first; if present it skips the network fetch. This avoids overwriting user edits with a fresh fetch.

**ID generation with `crypto.randomUUID()`** — Available in all modern browsers, guaranteed unique within the session, no dependency needed.

**Inline confirmation for unchanged default value** — When the user commits with `--value--` unchanged, instead of silently keeping or discarding the node the system shows a compact inline confirmation row (`Keep / Discard`) in place of the label. This avoids `window.confirm()` (which breaks the dark theme and blocks the thread) and keeps feedback in-context. "Keep" dismisses the confirmation and returns focus to the input with `--value--` selected. "Discard" calls `removeNode`.

**Fixed navigation width** — `Navigation.module.css` uses `width: 220px; flex-shrink: 0` so the panel never resizes regardless of label length. This replaces the earlier `min-width` approach.

## Risks / Trade-offs

- **JS truncation cost** → `ResizeObserver` fires on layout changes. Debouncing is not needed since label length is static after commit; the observer is disconnected after first measurement.
- **`sessionStorage` vs network fetch** — Once the session has stored data, network changes to `/api/tree` are not reflected until the tab is closed. This is the correct trade-off for a session-persistence feature, but must be documented.
- **Ctrl+click on Windows/Linux vs macOS** — Ctrl+click is consistent across platforms for this use case (macOS users use Cmd for system actions, Ctrl is free in-app).
