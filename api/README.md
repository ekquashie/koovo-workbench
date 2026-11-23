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

## Data on startup

The brief's dataset (`src/data/seed-transactions.json`, R001–R011) is imported
when the app starts, giving 5 valid / 4 needs attention / 2 excluded. Set
`SEED_ON_STARTUP=false` in `.env` to start empty. Integration tests always
start empty.

## Endpoints

All under `/api/v1` and wrapped as `{ code, message, data }`. Full docs at
`/api/docs`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | liveness (unversioned) |
| POST | `/api/v1/imports` | import `{ "records": [...] }` (max 1000) and re-validate everything |
| GET | `/api/v1/imports` | import batches, oldest first |
| GET | `/api/v1/transactions?clientId=&status=` | records with validation + review state, arrival order |
| GET | `/api/v1/transactions/summary?clientId=` | counts per validation status, plus every client |
| GET | `/api/v1/transactions/:id` | detail: raw input, amounts, issues, related records, review, history |

Filters are optional and combine; `status` is case-insensitive
(`VALID`, `NEEDS_ATTENTION`, `EXCLUDED`). Amounts come back as pence
(`totalMinor: 12000`) and as display strings (`total: "120.00"`); `null`
means missing in the source.

Import a file of rows shaped like the seed file:

```bash
curl -X POST localhost:4000/api/v1/imports \
  -H 'Content-Type: application/json' \
  -d @src/data/seed-transactions.json
```

Each row has 10 string columns: `record, client, source, sourceId, type,
status, supplier, subtotal, vat, total`. Use `"-"` for a missing value.
Amounts must be strings (`"120.00"`), not numbers. If any row is malformed the
whole import is rejected with 400 and an `errors` map like
`{ "records.3.total": "R004: Total \"12.345\" is not a valid amount (e.g. 120.00)" }`.
