---
applyTo: "web-svr/src/**/*.ts"
---

Guidelines for backend code in this repository:

* **Use TypeScript** for all server files.  Avoid `.js` files unless dealing
  with third‑party code.
* **Keep routes thin**.  Define your API endpoints in `web‑svr/src/routes` and
  delegate business logic to service modules (not yet implemented in this
  scaffold).  Controllers should handle input validation and call services.
* **Express setup** lives in `web‑svr/src/app.ts`.  Middleware for JSON
  parsing, authentication, or logging should be added there.
* **Configuration**: Use environment variables defined in `.env` files via
  `process.env`.  Do not hard‑code secrets or connection strings in code.
* **Type safety**: Define request and response types where appropriate.  Use
  interfaces or `zod` schemas if you introduce validation libraries.
* **Error handling**: Centralize error handling middleware rather than
  handling errors in every route.  Return consistent JSON error shapes.
* **Avoid adding new dependencies** unless clearly beneficial.  The Express
  API should remain straightforward.
* **Testing**: Write unit tests for your routes and services using supertest + vitest.  Aim
  for good coverage of edge cases and error conditions.  Place tests in `__tests__` folders next to the code they test.
