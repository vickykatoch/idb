---
applyTo: "web-ui/src/**/*.{ts,tsx}"
---

Use **React 19** with TypeScript and **Vite 8**.  Follow these guidelines when
adding or editing frontend code:

* **Prefer function components** and hooks.  Do not use class components.
* **Type all props explicitly**; avoid `any` unless unavoidable.
* **Plugin architecture**: Each plugin lives under the top‑level
  `ui‑plugins/<name>` folder and exports a default component from
  `index.tsx`.  To add a new feature, create a folder in `ui‑plugins`
  instead of editing the core router.  Components should focus on
  rendering; fetch data in hooks or higher‑level containers.
* **Dynamic routing**: The main router uses `import.meta.glob('../../ui-plugins/**/index.tsx')`
  to discover plugin modules outside the UI package.  Do not hard‑code
  plugin imports or route definitions outside of `App.tsx`.  Use
  `React.lazy` with `import.meta.glob` to lazily load plugin components.
* **Path aliases**: Imports starting with `@/` resolve to `src/` via
  tsconfig paths.  Use these for local modules instead of relative
  `'../../'` imports.
* **State management**: Prefer the built‑in `useState`, `useReducer`, and
  context APIs.  Avoid introducing new state libraries unless justified.
* **Styling**: You may use Tailwind CSS or plain CSS modules.  Keep
  styles scoped to the component whenever possible.
* **Avoid side effects in render**; place them in `useEffect` hooks.
* **Testing**: Use React Testing Library and Vitest for unit tests.  Test components in isolation and mock external dependencies. Each folder should have a `__tests__` subfolder for its tests.
