## MODIFIED Requirements

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
