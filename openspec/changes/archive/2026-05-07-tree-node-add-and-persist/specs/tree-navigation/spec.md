## ADDED Requirements

### Requirement: Navigation panel has a fixed width
The system SHALL render the navigation panel at a fixed width that does not change based on the length of node labels.

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
