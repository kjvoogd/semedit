## MODIFIED Requirements

### Requirement: User can import a Turtle file to populate the tree
The system SHALL provide an "Import" link on the right side of the header bar that opens a file picker allowing the user to select a `.ttl` (Turtle) file from disk. On selection the file SHALL be uploaded to `POST /api/upload` on the Express server. On success, the tree SHALL be reloaded from `GET /api/tree` to reflect the newly inserted Memgraph data.

#### Scenario: Import link is always visible in the header
- **WHEN** the application is displayed
- **THEN** an "Import" link is visible on the right side of the header bar at all times

#### Scenario: Selecting a valid Turtle file uploads it and reloads the tree
- **WHEN** the user clicks "Import" and selects a valid `.ttl` file
- **THEN** the file is POSTed to the server, inserted into Memgraph, and the navigation tree is reloaded from `GET /api/tree`

#### Scenario: Imported tree is persisted to Memgraph
- **WHEN** a Turtle file is successfully uploaded
- **THEN** the data is stored in Memgraph and survives a server restart (unlike sessionStorage)

#### Scenario: Server error is shown inline
- **WHEN** the server returns a non-200 response to `POST /api/upload`
- **THEN** the error message from the server response is shown next to the Import link in the header and the existing tree is unchanged
