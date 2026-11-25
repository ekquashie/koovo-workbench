# Koovo Review Workbench

Accounting Data Review Workbench: validates fictional Xero/Sage transactions
and lets an accountant review them.

| Package | Stack | Port |
|---|---|---|
| [`api/`](api/README.md) | NestJS 12, TypeScript, class-validator, in-memory storage | 4000 (`/api/v1`, docs at `/api/docs`) |
| [`web/`](web/README.md) | React 19, Vite, TanStack Query, react-hook-form + zod | 5173 |

## Prerequisites

Node 24+ and pnpm (the version is pinned in `package.json`; pnpm 10+ switches
to it automatically).

## Run locally

```bash
pnpm install   # installs the root tools, api/ and web/, and the git hook
pnpm dev       # API on :4000 and web on :5173 together
```

Open http://localhost:5173. No `.env` is needed: every setting has a default
(see each `.env.example` to change ports or turn off the seed data).

To run them separately: `cd api && pnpm start:dev` and `cd web && pnpm dev`.

## Checks and tests

| Command (from the root) | What it runs |
|---|---|
| `pnpm check` | everything CI runs except e2e: typecheck, lint, format check, tests, build |
| `pnpm test` | API unit + API integration (HTTP through the full app) + web (Vitest) |
| `pnpm e2e` | Playwright: real API + built UI in Chrome |
| `pnpm typecheck` / `pnpm lint` / `pnpm build` | that step for both apps |
| `pnpm format` | Prettier on both apps |

`pnpm e2e` starts its own API on :4010 and UI on :5180, so it doesn't clash
with dev servers. It uses your installed Google Chrome; without Chrome, run
`pnpm --dir web exec playwright install chromium` once and use
`PW_CHANNEL=chromium pnpm e2e`.

## Git hook and CI

- **Pre-commit** (husky + lint-staged): staged files only. ESLint `--fix` and
  Prettier, with each app's own config. An ESLint error stops the commit.
- **GitHub Actions** ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)),
  on every push and on PRs to `dev`/`main`, three jobs in parallel:
  - **API**: typecheck, lint, format, unit, integration, build
  - **Web**: typecheck, lint, format, tests, build
  - **End to end**: Playwright in Chromium against the real API (report
    uploaded if it fails)
