## ADDED Requirements

### Requirement: Nodes can be reordered within their parent by drag-and-drop
The system SHALL allow a user to drag any tree node and drop it before or after a sibling to change its position within the same parent.

#### Scenario: Drag begins on a node
- **WHEN** the user starts dragging a tree node
- **THEN** the dragged node is visually dimmed and a drag ghost follows the cursor

#### Scenario: Drop indicator appears between siblings
- **WHEN** the user drags over the top or bottom half of a sibling node within the same parent
- **THEN** a horizontal line indicator is shown above or below that sibling to mark the insertion point

#### Scenario: Dropping reorders the node
- **WHEN** the user releases the drag over a sibling insertion indicator
- **THEN** the dragged node is moved to that position within the parent and the tree re-renders

#### Scenario: Drag cancelled
- **WHEN** the user presses Escape or releases the drag outside a valid drop target
- **THEN** the tree reverts to its original order and all indicators are removed

### Requirement: Nodes can be reparented by dragging onto another node
The system SHALL allow a user to drag a node onto a different node to move it there as the last child of that target node.

#### Scenario: Drop indicator highlights reparent target
- **WHEN** the user drags a node over the centre of another node (not one of its ancestors or itself)
- **THEN** the target node row is highlighted with a coloured border to indicate reparenting

#### Scenario: Dropping reparents the node
- **WHEN** the user releases the drag over a highlighted reparent target
- **THEN** the dragged node is removed from its current parent and appended as the last child of the target node, and the target node expands if it was collapsed

#### Scenario: A node cannot be dropped onto itself or its descendants
- **WHEN** the user drags a node over itself or any of its descendants
- **THEN** no drop indicator is shown and dropping has no effect

### Requirement: Tree state is persisted after every drag-and-drop
The system SHALL write the updated tree to sessionStorage after every successful drop.

#### Scenario: Tree persists after reorder
- **WHEN** the user successfully reorders or reparents a node
- **THEN** the new tree structure is saved to sessionStorage and survives a page reload
