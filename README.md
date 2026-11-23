# Koovo Review Workbench

Accounting Data Review Workbench: validates fictional Xero/Sage transactions
and lets an accountant review them.

| Package | Stack | Port |
|---|---|---|
| [`api/`](api/README.md) | NestJS 12, TypeScript, class-validator, in-memory storage | 4000 (`/api/v1`, docs at `/api/docs`) |
| [`web/`](web/README.md) | React 19, Vite, TanStack Query, react-hook-form + zod | 5173 |

## Prerequisites

Node 24+ and pnpm 11+.

## Run locally

```bash
# terminal 1
cd api && pnpm install && cp .env.example .env && pnpm start:dev
# terminal 2
cd web && pnpm install && cp .env.example .env && pnpm dev
```

Open http://localhost:5173.

## Tests

```bash
cd api && pnpm test && pnpm test:integration
cd web && pnpm test
```

## Docs

- [`docs/DESIGN.md`](docs/DESIGN.md): rules, data model, API
- [`docs/PLAN.md`](docs/PLAN.md): task list and progress
- [`docs/INTERVIEW-NOTES.md`](docs/INTERVIEW-NOTES.md): engineering decisions explained
