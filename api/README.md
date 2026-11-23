# Koovo Review Workbench API

NestJS API that validates accounting transactions and records review decisions.
Part of the `koovo-workbench` monorepo; see the root README and `docs/`.

## Run

```bash
pnpm install
cp .env.example .env
pnpm start:dev        # http://localhost:4000/api, docs at /api/docs
```

## Test

```bash
pnpm test               # unit
pnpm test:integration   # HTTP through the full app
```
