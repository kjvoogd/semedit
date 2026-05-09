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
The system SHALL render an × control on every node that, when clicked, shows an inline confirmation before removing the node. If the user confirms, the node and its subtree are removed; if the user cancels, the node remains.

#### Scenario: Clicking × shows delete confirmation
- **WHEN** the user clicks the × control on a node
- **THEN** an inline confirmation row replaces the node label, showing a "Delete?" prompt with a "Yes" (confirm) option and a "No" (cancel) option

#### Scenario: Confirming deletion removes the node
- **WHEN** the user selects "Yes" in the delete confirmation
- **THEN** that node and all its descendants are removed from the tree

#### Scenario: Cancelling deletion keeps the node
- **WHEN** the user selects "No" in the delete confirmation
- **THEN** the node remains in the tree and its normal label row is restored

#### Scenario: Removing a child node does not affect siblings
- **WHEN** the user confirms removal of a child node
- **THEN** the parent node and its other children remain visible

### Requirement: Tree supports arbitrary nesting depth
The system SHALL render child nodes recursively to any depth returned by the REST endpoint.

#### Scenario: Deeply nested tree
- **WHEN** the REST response contains nodes nested more than two levels deep
- **THEN** all levels are rendered correctly with their own expand/collapse controls

### Requirement: Navigation panel has a viewport-proportional width
The system SHALL render the navigation panel at 20% of the viewport width, which does not change based on the length of node labels.

#### Scenario: Wide labels do not expand the panel
- **WHEN** a node label is long enough to exceed the panel width
- **THEN** the navigation panel width remains unchanged

#### Scenario: Panel width is consistent across all tree states
- **WHEN** nodes are added, removed, or expanded
- **THEN** the navigation panel width remains the same

### Requirement: Node labels are capped at two lines with truncation
The system SHALL render node labels on at most two lines. If the label requires more than two lines the text SHALL be truncated and a `..` suffix appended to the visible text.

#### Scenario: Short label renders on one line
- **WHEN** a node label fits within the navigation panel width on a single line
- **THEN** the full label is displayed without truncation

#### Scenario: Long label is truncated after two lines
- **WHEN** a node label would require more than two lines to display in full
- **THEN** the label is truncated and ends with `..`

#### Scenario: Truncation does not change navigation panel width
- **WHEN** any node label is truncated
- **THEN** the navigation panel width remains unchanged

### Requirement: Truncated nodes show a tooltip on hover
The system SHALL display a styled tooltip containing the full label when the user hovers over a truncated node.

#### Scenario: Tooltip appears on hover
- **WHEN** the user hovers over a node whose label is truncated
- **THEN** a tooltip showing the full label appears near the node

#### Scenario: Tooltip is styled with black background, white text, and white border
- **WHEN** the tooltip is visible
- **THEN** it has a black background, white text, and a 1px white border

#### Scenario: No tooltip for non-truncated nodes
- **WHEN** the user hovers over a node whose label is not truncated
- **THEN** no tooltip is shown

### Requirement: Tree state is persisted for the browser session
The system SHALL save the complete tree state to sessionStorage after every mutation and restore it on mount, so that the tree survives a page refresh within the same browser tab.

#### Scenario: Tree is restored after page refresh
- **WHEN** the user refreshes the page within the same browser tab
- **THEN** the tree renders with the same nodes and structure as before the refresh

#### Scenario: Added nodes survive a refresh
- **WHEN** the user adds a child node and then refreshes the page
- **THEN** the added node is present in the restored tree

#### Scenario: Removed nodes are not restored
- **WHEN** the user removes a node and then refreshes the page
- **THEN** the removed node is absent from the restored tree

#### Scenario: Session data is cleared on tab close
- **WHEN** the browser tab is closed and a new tab is opened
- **THEN** the tree is fetched fresh from the REST endpoint
