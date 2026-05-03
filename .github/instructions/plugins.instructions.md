---
applyTo: "ui-plugins/**/*.{ts,tsx}"
description: "Guidelines for creating and maintaining UI plugins"
---

# Plugin Development Guidelines

This repository uses a plugin architecture for the React frontend.  Plugins live
in the `ui-plugins` folder at the root of the project and are discovered
dynamically at runtime by the main app.  Follow these rules when adding or
modifying plugins:

## Structure

- Each plugin resides in its own subdirectory under `ui-plugins`.  The directory
  name determines the URL path (e.g. `ui-plugins/chat` becomes `/chat`).
- Export a default React component from `index.tsx` in your plugin folder.  The
  component represents the entire plugin page.  Use named exports for any
  helper components or utilities.
- Keep the component self-contained: avoid calling APIs or performing heavy
  business logic directly in the plugin.  Use the service layer in
  `web-svr` or `web-ui/src/services` if you need to fetch data.
- Write your plugin in TypeScript and include explicit props and state types.

## Testing

- Add unit tests alongside your plugin.  Name the test file
  `*.test.tsx`.  For example, `ui-plugins/chat/chat.test.tsx`.
- Use [Vitest](https://vitest.dev/) with the `@testing-library/react` helpers for
  component tests.  Tests are configured globally in the Vite config and
  run with `npm run test:unit`.
- Ensure your tests cover basic rendering and interaction.  Use jest‑dom
  matchers such as `toBeInTheDocument()`.
- Use React Testing Library and Vitest for unit tests.  Test components in isolation and mock external dependencies. Each folder should have a `__tests__` subfolder for its tests.

## Naming

- Avoid spaces or special characters in plugin folder names; use kebab‑case if
  multiple words are needed (e.g. `user-profile`).
- Keep component names PascalCase (e.g. `UserProfilePlugin`).

## Adding a plugin

1. Create a new folder under `ui-plugins` with your plugin name.
2. Add an `index.tsx` file exporting a default React component.  Use
   the existing plugins as examples.
3. Write a unit test file ending in `.test.tsx` to verify your component.
4. Restart the dev server.  The new route will appear automatically in the
   navigation.

By following these guidelines, you ensure that new features integrate
seamlessly into the existing plugin architecture and remain maintainable over
time.