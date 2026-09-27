# Slimverlof.nl

## Deployment

This is a Vite application. Production deployments must serve the generated
`dist/` directory, not the repository root. The included `Dockerfile` builds
the app and serves `dist/` through Nginx, including the fallback needed for
client-side routes.

For a webserver with its own build pipeline, use:

```sh
npm ci
npm run build
```

Then configure the document root to the resulting `dist/` directory.

The previous white page was caused by serving the source `index.html`: it
loaded `/src/main.jsx` directly, which was returned with the wrong MIME type
and therefore blocked by the browser.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# Hermes E2E Test - 2026-07-24T09:56:53Z

This PR tests the automated Hermes kanban PR review and merge pipeline.

## Tests, coverage and CI

Two suites live side by side:

```
npm test             # deploy workflow tests (node --test, tests/*.test.mjs)
npm run test:unit    # unit + component suite (vitest)
npm run test:watch   # vitest watch mode
npm run coverage     # vitest with V8 coverage (line total + coverage/)
npm run lint         # eslint
npm run lint:ci      # eslint, failing on warnings too (used by CI)
npm run format:check # prettier check
```

The vitest suite runs in a jsdom environment and reports V8 coverage for everything under `src/`; its files use the `*.spec.*` pattern so `node --test` never picks them up.

`npm run coverage` prints the per-file table plus a machine readable summary at `coverage/coverage-summary.json`. `node scripts/coverage-summary.mjs` prints the line total from that summary and fails when the summary is missing — an unmeasurable metric is reported as unavailable, never as zero. The coverage floors live in `vitest.config.js` and fail the run when they are not met.

GitHub Actions (`.github/workflows/ci.yml`) runs eslint, prettier, the production build, `node --test` and the coverage run on every push and pull request, and reports the line total in the job summary.
