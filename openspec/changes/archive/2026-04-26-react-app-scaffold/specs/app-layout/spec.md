## ADDED Requirements

### Requirement: App renders a Header component
The system SHALL render a `<Header>` component at the top of the page that displays the text "Header".

#### Scenario: Header is visible
- **WHEN** the App component is rendered
- **THEN** a Header element containing the text "Header" is present in the output

### Requirement: App renders a Navigation component
The system SHALL render a `<Navigation>` component below the Header that displays the text "Navigation".

#### Scenario: Navigation is visible
- **WHEN** the App component is rendered
- **THEN** a Navigation element containing the text "Navigation" is present in the output

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
