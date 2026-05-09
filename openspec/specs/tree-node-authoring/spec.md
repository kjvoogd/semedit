### Requirement: Ctrl+click on a node adds an editable child
The system SHALL insert a new editable child node when the user Ctrl+clicks an existing tree node.

#### Scenario: Ctrl+click triggers child insertion
- **WHEN** the user holds Ctrl and clicks a tree node
- **THEN** a new child node is appended to that node's children and the node expands to reveal it

#### Scenario: New child is immediately editable
- **WHEN** a new child node is inserted
- **THEN** an input field containing `--value--` is focused and ready for editing

#### Scenario: Normal click is unaffected
- **WHEN** the user clicks a tree node without holding Ctrl
- **THEN** no child is added and the existing expand/collapse behaviour applies

### Requirement: Inline edit commits on Enter or blur
The system SHALL save the typed label when the user presses Enter or moves focus away from the input, provided the value is not the default.

#### Scenario: Enter commits a changed label
- **WHEN** the user types a non-default label and presses Enter
- **THEN** the input is replaced by a rendered label showing the typed value

#### Scenario: Blur commits a changed label
- **WHEN** the user types a non-default label and clicks elsewhere
- **THEN** the input is replaced by a rendered label showing the typed value

### Requirement: Committing the default value prompts the user
The system SHALL display an inline confirmation when the user commits without changing the default `--value--` label, asking whether to keep or discard the node. The confirmation SHALL be rendered at the left edge of the node row, replacing the toggle/spacer and label, so it is immediately visible without being obscured by indentation.

#### Scenario: Commit with unchanged default shows confirmation at left
- **WHEN** the user commits (Enter or blur) and the input value is `--value--`
- **THEN** an inline confirmation starting at the left edge of the node row appears with a "Yes" (Keep) option and a "No" (Discard) option

#### Scenario: Choosing Discard removes the node
- **WHEN** the user selects "No" in the confirmation
- **THEN** the new node is removed from the tree

#### Scenario: Choosing Keep refocuses the input
- **WHEN** the user selects "Yes" in the confirmation
- **THEN** the input reappears with `--value--` selected and focused so the user can type a new label

### Requirement: Escape cancels the new node
The system SHALL remove the uncommitted child node when the user presses Escape during inline editing.

#### Scenario: Escape removes the pending node
- **WHEN** the user presses Escape while editing a new node
- **THEN** the new node is removed and the parent's children revert to their prior state
