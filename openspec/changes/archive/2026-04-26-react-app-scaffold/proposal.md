## Why

Semedit currently has no frontend. A React app scaffold with standard layout components (Header, Footer, Navigation, Main Body) is needed as the foundation for the RDF/SKOS editing UI.

## What Changes

- Add React and React DOM as dependencies
- Create `src/app-components/` folder with four layout components
- Add a root `App` component that composes the layout
- Wire up a basic entry point to render the React app

## Capabilities

### New Capabilities
- `app-layout`: Top-level React app with Header, Footer, Navigation, and Main Body layout components rendered in a single-page shell

### Modified Capabilities

## Impact

- `package.json`: Add `react`, `react-dom`, and supporting type packages
- `tsconfig.json`: Enable JSX support
- `src/`: New `app-components/` folder and updated entry point
