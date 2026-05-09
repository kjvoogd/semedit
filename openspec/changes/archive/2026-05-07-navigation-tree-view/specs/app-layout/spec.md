## MODIFIED Requirements

### Requirement: App renders a Header component
The system SHALL render a `<Header>` component that spans the full width of the viewport as a styled bar at the top of the page.

#### Scenario: Header is full-width
- **WHEN** the App component is rendered
- **THEN** the Header element spans 100% of the viewport width with no horizontal margins

#### Scenario: Header is visible
- **WHEN** the App component is rendered
- **THEN** a Header element is present at the top of the page

### Requirement: App renders a Navigation component
The system SHALL render a `<Navigation>` component below the Header that displays a collapsible tree structure populated from a REST endpoint.

#### Scenario: Navigation renders a tree
- **WHEN** the App component is rendered and the REST endpoint returns data
- **THEN** the Navigation element displays a tree of nodes with expand/collapse controls
