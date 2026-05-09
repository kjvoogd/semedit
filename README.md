# Semedit

> **Copilot agent setup prompt**
>
> You are setting up the Semedit development environment. Follow these steps in order:
>
> 1. **Install Node.js 18+ and pnpm** if not already present (`npm install -g pnpm`).
> 2. **Clone the repository**:
>    ```
>    git clone https://github.com/kjvoogd/semedit.git
>    cd semedit
>    ```
> 3. **Install dependencies**: run `pnpm install` in the project root.
> 4. **Start Memgraph** in Docker (detached, only if not already running):
>    ```
>    docker run -d -p 7687:7687 -p 7444:7444 --name memgraph memgraph/memgraph-mage
>    ```
> 5. **Start both dev servers** with a single command:
>    ```
>    pnpm dev:all
>    ```
>    This starts the Express API server on port 3001 and the Vite frontend on port 5173.
> 6. **Verify**: open http://localhost:5173 — you should see the Semedit UI. The Import link in the header lets you upload a `.ttl` Turtle file.

---

An online editor for RDF and SKOS files.

## Prerequisites

- Node.js 18+
- pnpm
- Docker (for Memgraph)

## Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Memgraph

```bash
docker run -d -p 7687:7687 -p 7444:7444 --name memgraph memgraph/memgraph-mage
```

Use `memgraph/memgraph-platform` instead if you want the Memgraph Lab UI on port 3000:

```bash
docker run -d -p 7687:7687 -p 7444:7444 -p 3000:3000 --name memgraph memgraph/memgraph-platform
```

### 3. Start the development servers

```bash
pnpm dev:all
```

This starts both the Vite frontend (http://localhost:5173) and the Express API server (http://localhost:3001) concurrently. The Vite dev server proxies all `/api/*` requests to the Express server.

To start them separately:

```bash
# Terminal 1 — Express API server
pnpm server

# Terminal 2 — Vite frontend
pnpm dev
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Vite dev server only |
| `pnpm server` | Start Express API server only |
| `pnpm dev:all` | Start both servers concurrently |
| `pnpm build` | Build the frontend for production |
| `pnpm preview` | Preview the production build |
| `pnpm type-check` | Run TypeScript type checking |

## Architecture

The app has two runtime components:

- **Frontend** — React 19 + TypeScript + Vite, served on port 5173 in development
- **API server** — Express 5 on port 3001; accepts Turtle file uploads and reads/writes Memgraph

```
semedit/
├── src/                        # React frontend (TypeScript)
│   ├── app-components/         # Header, Navigation, TreeNode, Footer
│   ├── hooks/                  # useTreeData
│   ├── lib/                    # parseTurtle, logger
│   └── types/                  # TreeItem type
├── server/                     # Express API server (ESM JS)
│   ├── db.js                   # neo4j-driver instance
│   ├── index.js                # Entry point, startup, index creation
│   ├── routes/upload.js        # POST /api/upload, GET /api/tree
│   ├── security/               # SecurityTombola file validation
│   └── services/               # memgraphLoader (N3 parser + Cypher)
├── vite.config.ts              # Vite config + /api proxy
└── package.json
```

## Importing data

Use the **Import** link in the header to upload a `.ttl` (Turtle) file. The file is validated, parsed server-side with N3.js, and inserted into Memgraph following the rules in `src/rules/memgraph_db_rules.md`. The navigation tree reloads automatically from Memgraph after a successful upload.

Uploading the same file a second time clears the previous data and re-inserts fresh — full reload semantics.

## License

MIT
