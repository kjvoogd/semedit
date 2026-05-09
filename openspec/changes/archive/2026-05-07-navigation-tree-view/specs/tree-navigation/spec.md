## ADDED Requirements

### Requirement: Navigation fetches tree data from a REST endpoint
The system SHALL fetch a `TreeItem[]` JSON array from a configurable REST endpoint on mount and render the result as a tree.

#### Scenario: Successful data fetch
- **WHEN** the Navigation component mounts and the REST endpoint returns a valid JSON array
- **THEN** the top-level tree nodes are rendered in the navigation panel

#### Scenario: Fetch error
- **WHEN** the REST endpoint returns an error or is unreachable
- **THEN** the navigation panel displays an error message instead of the tree

#### Scenario: Loading state
- **WHEN** the fetch is in progress
- **THEN** the navigation panel displays a loading indicator

### Requirement: Tree nodes can be expanded and collapsed
The system SHALL render a + control on collapsed nodes that have children, and a − control on expanded nodes, toggling visibility of child nodes.

#### Scenario: Expanding a node
- **WHEN** the user clicks the + control on a collapsed node with children
- **THEN** the node's children become visible and the control changes to −

#### Scenario: Collapsing a node
- **WHEN** the user clicks the − control on an expanded node
- **THEN** the node's children are hidden and the control changes to +

#### Scenario: Leaf node has no expand control
- **WHEN** a node has no children
- **THEN** no +/− control is rendered for that node

### Requirement: Expand and collapse is animated
The system SHALL animate the reveal and hiding of child nodes using a CSS height transition.

#### Scenario: Children animate open
- **WHEN** a node is expanded
- **THEN** the children panel transitions smoothly from hidden to visible

#### Scenario: Children animate closed
- **WHEN** a node is collapsed
- **THEN** the children panel transitions smoothly from visible to hidden

### Requirement: Tree nodes can be removed
The system SHALL render an × control on every node that, when clicked, removes that node (and its subtree) from the rendered tree.

#### Scenario: Removing a node
- **WHEN** the user clicks the × control on a node
- **THEN** that node and all its descendants are removed from the tree view

#### Scenario: Removing a child node does not affect siblings
- **WHEN** the user removes a child node
- **THEN** the parent node and its other children remain visible

### Requirement: Tree supports arbitrary nesting depth
The system SHALL render child nodes recursively to any depth returned by the REST endpoint.

#### Scenario: Deeply nested tree
- **WHEN** the REST response contains nodes nested more than two levels deep
- **THEN** all levels are rendered correctly with their own expand/collapse controls
