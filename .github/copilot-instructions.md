# Repository Instructions for GitHub Copilot

## Overview

This repository is a monorepo (turborepo) that contains a React frontend, React libraries, and individual business UIs. The frontend is built using Vite 8 and follows a **plugin architecture**, where each folder under the `plugins` directory defines a route that is loaded dynamically at runtime. The top level directory `libs` contains shared React libraries that can be used across different plugins. The project assumes the developer is using VS Code with GitHub Copilot

## Stack

- React 19 with TypeScript 6
- Vite 8
- Turborepo
- pnpm
- React Router for routing
- Plugin system using `import.meta.glob` and `React.lazy` to load each
  plugin lazily at runtime

## Coding rules

- **Use TypeScript** for all new files; avoid plain JavaScript.
- **Follow the plugin architecture**:
  - Each plugin lives under `plugins/<name>/index.ts` and exports a
    default React component. The component is mounted at `/<name>`.
  - Do not modify the core router when adding a new plugin. Instead, create
    a new folder under `plugins` and provide an `index.ts` file.
  - Keep plugin components focused; avoid business logic and API calls.
- **Main router** resides in `web-shell/src/App.tsx` and uses
  `import.meta.glob('../../plugins/**/index.ts')` to discover plugins
  outside the UI package. When extending routing, reuse this dynamic pattern
  rather than hard‑coding imports.
- **Backend routes** should remain thin: controllers live in
  `web‑svr/src/routes` and should forward business logic to services (not yet
  implemented in this scaffold).
- **Node version**: rely on Node 20.19+ to support Vite 8’s ESM‑only
  distribution【680582402486350†L230-L236】.
- **Avoid unnecessary dependencies**. Vite 8 includes built‑in support for
  tsconfig path aliases and React Refresh【680582402486350†L247-L253】; do not add
  redundant plugins.
- **Imports** should respect path aliases defined in `tsconfig.json` (`@/`
  for `src`).
- **Add documentation** when introducing new plugins or API endpoints.

## File conventions

- `web-shell/src/main.tsx` creates the React root and imports `App.tsx`.
- `web-shell/src/App.tsx` sets up routing with dynamic plugin discovery.
  - Each plugin exports a default component from `index.ts` and may contain
    other files if needed. Plugins live in the `plugins` folder, not in
    `web-shell`.
- `web‑svr/src/index.ts` starts the Express server and uses the router from
  `web‑svr/src/app.ts`.
- Environment variables meant for the frontend must be prefixed with
  `VITE_` and defined in `.env` or `.env.local`. A sample file
  `.env.example` is provided.

## Quality bar

- Keep functions small and focused.
- Use meaningful names; avoid abbreviations.
- Add light comments only when the intent is not obvious.
- Avoid leaving `TODO` without follow‑up; if a task is deferred, explain why.
- Ensure that new plugins do not break existing routes.
- Write tests for new API endpoints and critical business logic (not yet
  implemented in this scaffold).
