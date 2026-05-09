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

### Requirement: App renders a MainBody component
The system SHALL render a `<MainBody>` component as the primary content area, displaying the text "MainBody".

#### Scenario: MainBody is visible
- **WHEN** the App component is rendered
- **THEN** a MainBody element containing the text "MainBody" is present in the output

### Requirement: App renders a Footer component
The system SHALL render a `<Footer>` component at the bottom of the page that displays the text "Footer".

#### Scenario: Footer is visible
- **WHEN** the App component is rendered
- **THEN** a Footer element containing the text "Footer" is present in the output

### Requirement: Components are located in app-components folder
The system SHALL place all layout components inside `src/app-components/` with one file per component.

#### Scenario: Component files exist
- **WHEN** the project source is examined
- **THEN** files `Header.tsx`, `Footer.tsx`, `Navigation.tsx`, and `MainBody.tsx` exist under `src/app-components/`
