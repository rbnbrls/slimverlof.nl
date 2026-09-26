# React + Vite

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

The suite runs on [Vitest](https://vitest.dev) in a jsdom environment and reports V8 coverage for everything under `src/`:

```
npm test             # run the test suite once
npm run test:watch   # watch mode
npm run coverage     # run the suite with coverage (line total + coverage/)
npm run lint         # eslint
npm run lint:ci      # eslint, failing on warnings too (used by CI)
npm run format:check # prettier check
```

`npm run coverage` prints the per-file table plus a machine readable summary at `coverage/coverage-summary.json`. `node scripts/coverage-summary.mjs` prints the line total from that summary and fails when the summary is missing — an unmeasurable metric is reported as unavailable, never as zero. The coverage floors live in `vitest.config.js` and fail the run when they are not met.

GitHub Actions (`.github/workflows/ci.yml`) runs eslint, prettier, the production build and the coverage run on every push and pull request, and reports the line total in the job summary.
