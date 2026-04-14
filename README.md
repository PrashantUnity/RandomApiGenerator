# RandomApiGenerator

Desktop app to define simple REST-style routes and serve **locally generated JSON** from a built-in mock server. Useful for prototyping front ends, demos, and tests without wiring a real backend.

Built with **Electron**, **React**, **Vite**, **Express** (mock API only on loopback), and **SQLite** (via `better-sqlite3`) for saving workspaces.

## Requirements

- **Node.js** 24+ (matches CI; Active LTS)
- npm 10+

## Development

Install dependencies (Electron native modules are rebuilt in `postinstall`):

```bash
npm install
```

Start the Vite dev server and Electron together:

```bash
npm run dev
```

The UI loads from `http://127.0.0.1:5173` in development. When you start the mock server, it binds to **127.0.0.1** only (not your LAN) and uses an **OS-assigned port** each session (shown in the app after start).

## Production build (UI)

```bash
npm run build
```

Output: `dist/` (loaded by Electron in packaged builds).

## Run packaged UI against Electron (local)

```bash
npm run electron:preview
```

## Desktop installers

```bash
npm run dist
```

Artifacts appear under `release/` (e.g. `.dmg`, `.exe`, `.AppImage` per target). Align `version` in `package.json` with the release tag users download; `electron-builder` uses it for app metadata.

Releases are published via **GitHub Releases** (see [.github/workflows/build-desktop.yml](.github/workflows/build-desktop.yml)): tag `vX.Y.Z` or use **Actions → Build desktop → Run workflow** with a semver version.

## Project layout

| Path | Role |
|------|------|
| `web/` | React SPA (Vite `root`) |
| `electron/` | Main process, preload, IPC, mock Express server |
| `shared/` | Mock value helpers shared with the mock API |
| `docs/` | Static site for GitHub Pages (download/help), not the interactive app |

## Local data

Workspaces and routes are stored in a SQLite file under the app **userData** directory (Electron), named `random-api-generator.db`. If the database cannot be opened, the app still runs but persistence is disabled and a banner explains the situation.

## Security note

The mock server is intended for **local development**: it binds to **127.0.0.1** only. Do not expose this process directly to untrusted networks.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite + Electron |
| `npm run build` | TypeScript + Vite production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (mock API validation / generator) |
| `npm run dist` | Build UI + package with electron-builder |

## License

See repository for license terms.
