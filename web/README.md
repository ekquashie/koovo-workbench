# Koovo Review Workbench: Web

React + Vite + TypeScript review UI for the accountant.

## Run

```bash
pnpm install
cp .env.example .env    # VITE_API_URL=http://localhost:4000/api/v1
pnpm dev                # http://localhost:5173 (start the API first)
```

Or from the repo root: `pnpm dev` starts the API and this app together.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on :5173 |
| `pnpm build` | Type-check and production build |
| `pnpm typecheck` | TypeScript only |
| `pnpm lint` | ESLint |
| `pnpm format` / `pnpm format:check` | Prettier (write / check only, as CI does) |
| `pnpm test` | Vitest (jsdom + Testing Library, axe-core accessibility checks) |
| `pnpm e2e` | Playwright: real API + built UI in Chrome (ports 4010/5180) |

## Structure

```
src/
  main.tsx, App.tsx, providers.tsx   entry, root view, React Query + toasts
  integration/                       API layer, one folder per domain:
    client.ts endpoints.ts types.ts utils.ts query-keys.ts
    <domain>/api-functions.ts        axios calls (typed, unwrapped by callers)
    <domain>/queries.ts              TanStack Query hooks
    <domain>/mutations.ts            TanStack mutations + cache invalidation
    domains: transactions, reviews, reviewers, imports, health
  lib/                               cn(), config, query client, zod form-schemas
  components/ui/                     small hand-written primitives (no shadcn)
  components/forms/                  react-hook-form + zod forms
  components/table/                  generic DataTable (TanStack Table): header,
                                     row, toolbar (search), pagination
  components/review/                 workbench screens (workbench.tsx is the page);
                                     <x>-columns.tsx = ColumnDef[] per table
  hooks/  store/                     custom hooks, zustand stores
                                     (workbench-store: filters + selection;
                                      reviewer-store: persisted reviewer)
  lib/labels.ts                      accountant-facing names for API enums
  test/                              Vitest setup, render helper, fake API
                                     (fixtures = the seeded R001–R011), axe helper
e2e/                                 Playwright specs (playwright.config.ts)
```

## Using the API layer

```ts
import {
  useTransactionsQuery, useTransactionSummaryQuery, useTransactionQuery,
  useReviewersQuery, useCreateReviewMutation, getFieldErrors, isConflictError,
} from "@/integration";

const { data } = useTransactionsQuery({ clientId: "C01", status: "NEEDS_ATTENTION" });
const review = useCreateReviewMutation();
review.mutate({ transactionId, reviewerId: "rev-ama",
  body: { action: "MARK_REVIEWED", expectedVersion: detail.review.version } });
```

- Hooks return unwrapped `data` (no `{ code, message }` envelope).
- Money: show `amounts.total` (a string); use `amounts.totalMinor` (pence)
  for any maths or sorting. `null` = missing.
- Errors: `getErrorMessage` for toasts, `getFieldErrors` for form fields
  (400), `isConflictError` for 409 "someone else changed it, reload".
- Cache keys live in `query-keys.ts`; mutations invalidate through them.

## The screen

- **Reviewing as**: choose Ama or Kofi (remembered in localStorage). Needed
  before any review action.
- **Summary cards**: Valid / Needs attention / Excluded for the chosen
  client. Click a card to filter by that status; click again to clear.
- **Filters**: client and validation status; *Clear filters* resets both.
- **Table**: one row per imported record (repeats included), amounts in £
  exactly as the API sends them, `—` for missing, issue names under the
  validation badge (hover for the full message), review state separately.
  Click a column header to sort (amounts sort numerically, missing last);
  search by record, supplier or source ID; 20 rows per page.
  Click a row (or Tab to it and press Enter) to open it.
- **Record panel** (right): why it needs attention (with links to related
  records), the source row as received next to how it was understood
  (flagged fields highlighted), the review decision and form, and the
  history. Escape closes it.
- **Reviewing**: pick a reviewer first. *Mark reviewed* only works on a
  Valid record; *Mark needs correction* needs a note (3–500 characters). If
  someone else changed the record since you opened it, you'll be told and
  shown the latest.
