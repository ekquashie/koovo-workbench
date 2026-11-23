# Koovo Review Workbench: Web

React + Vite + TypeScript review UI for the accountant.

## Run

```bash
pnpm install
cp .env.example .env    # VITE_API_URL=http://localhost:4000/api/v1
pnpm dev                # http://localhost:5173 (start the API first)
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on :5173 |
| `pnpm build` | Type-check and production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest (jsdom + Testing Library) |

## Structure

```
src/
  main.tsx, App.tsx, providers.tsx   entry, root view, React Query + toasts
  integration/                       API layer, one folder per domain:
    client.ts endpoints.ts types.ts utils.ts
    <domain>/api-functions.ts        axios calls (typed, unwrapped by callers)
    <domain>/queries.ts              TanStack Query hooks
    <domain>/mutations.ts            TanStack mutations + cache invalidation
  lib/                               cn(), config, query client, zod form-schemas
  components/ui/                     small hand-written primitives (no shadcn)
  components/forms/                  react-hook-form + zod forms
  components/review/                 workbench screens
  hooks/  store/                     custom hooks, zustand stores
```
