# Semedit

An online editor for RDF and SKOS files.

## Prerequisites

- Node.js 18+
- pnpm

## Installation

```bash
pnpm install
docker run -p 7687:7687 -p 7444:7444 --name memgraph memgraph/memgraph-mage
```

## Development

Run the development server:

```bash
pnpm run dev
```

## Build

Compile TypeScript to JavaScript:

```bash
pnpm run build
```

## Start

Run the compiled project:

```bash
pnpm start
```

## Dependencies

- **openspec** - For RDF and SKOS specifications support

## Project Structure

```
semedit/
├── src/          # TypeScript source files
├── dist/         # Compiled JavaScript output
├── package.json  # Project metadata and dependencies
├── tsconfig.json # TypeScript configuration
└── README.md     # Project documentation
```

## License

MIT
