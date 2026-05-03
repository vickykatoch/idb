---
description: "Guidelines for reviewing changes in this repository"
---

When reviewing pull requests or Copilot suggestions, ensure the following:

1. **Plugin architecture integrity**: New features on the UI should be added as
   plugins under `web‑ui/src/plugins`.  Do not accept changes that hard‑code
   routes for plugins or mix plugin code into the core application.  Verify
   that the plugin directory has its own `index.tsx` and that lazy loading is
   used in the main router.
2. **Type safety**: All new code must be written in TypeScript with explicit
   types for props, state, and function parameters.  Avoid `any`.
3. **Node version compliance**: Ensure that no code reintroduces CommonJS
   patterns that conflict with Vite 8’s ESM‑only requirement or Node 20.19+
   restrictions【680582402486350†L230-L236】.
4. **Consistency**: Check that naming conventions and folder structures are
   consistent with the rest of the project.  For example, UI services should
   live in `web‑ui/src/services` (not yet created in this scaffold) and API
   routes should live in `web‑svr/src/routes`.
5. **Minimal dependencies**: Challenge additions of new dependencies.  Vite 8
   and the React plugin provide many features out of the box【680582402486350†L247-L253】; ensure
   that added packages are justified.
6. **Performance**: Review asynchronous code for proper error handling and
   avoid blocking operations on the server.  In the UI, make sure
   components are lazy‑loaded and heavy computations are memoized.
7. **Documentation**: New plugins or endpoints should come with README
   updates or inline comments explaining their purpose and usage.
