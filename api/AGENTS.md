# Agent guide: Koovo Review Workbench API

NestJS 12 API for the Koovo take-home: validates fictional Xero/Sage
transactions and records accountant review decisions. Built from our
`nestjs-template` conventions, minus Postgres/Redis/queues/auth/payments
(the brief allows in-memory storage and a mock reviewer).
**Follow the conventions below; when in doubt, copy the nearest module.**

## Commands

```bash
pnpm start:dev            # API on :4000, Swagger at /api/docs
pnpm build && pnpm lint   # must both be clean before you finish
pnpm test                 # unit tests (src/**/*.spec.ts)
pnpm test:integration     # boots AppModule in-process, HTTP via supertest
```

## Layout

```
src/
  main.ts, app.module.ts   bootstrap; global interceptor/filter
  config/                  configuration.ts (typed config), app.setup.ts
                           (prefix, versioning, validation, CORS), swagger.ts
  exceptions/              CustomExceptionsFilter, FieldValidationException
  interceptors/            ResponseInterceptor ({code,message,data})
  logger/                  AppLogger (winston, log/app)
  helper/                  money.ts, transforms.ts, utils.ts
  storage/                 StorageModule (global): abstract repositories +
                           Map-backed implementations, VersionConflictError
  imports/ transactions/ reviews/   enums/ + entities/ (plain classes)
  transactions/validation/ pure validation engine (parse, rules, repeats)
  data/                    seed-transactions.json (the brief's dataset)
  testing/                 test builders (aRaw, recordsFromRaw); not built
test/*.integration-spec.ts
```

A domain module is `src/<name>/` with `<name>.module.ts`, `<name>.controller.ts`,
`<name>.service.ts`, `dto/`, `enums/`, and optional `<name>.mapper.ts`.

## Rules

- **No `console.log`.** Inject `AppLogger`.
- **Responses:** return plain data; `ResponseInterceptor` wraps it as
  `{ code, message, data }`.
- **Errors:** throw Nest HTTP exceptions with human-readable messages; use
  `FieldValidationException` for per-field errors.
- **Validation:** every body/query is a DTO with class-validator decorators;
  trim strings with `@Transform(trim)`. Exception: `RawTransactionDto` keeps
  raw input untouched (parsing trims later).
- **Versioning:** `/api/v1/...`; only health is `VERSION_NEUTRAL`.
- **Storage:** inject the abstract repository (e.g. `ReviewRepository`),
  never an `InMemory*` class. Map `VersionConflictError` to 409.
- **Money:** compare and sum in integer minor units, never floats. Parse
  input with `parseMinor` (decimal string → pence), print with `formatMinor`.
- **Imports** go through `ImportsService.import()` only (the seed too).
  After changing stored records, call `ValidationService.revalidateAll()`.
- **Config:** new env vars go in `config/configuration.ts` **and** `.env.example`.
- Short doc comments that explain *why*; no noise comments.

## Testing

- Unit tests next to code (`*.spec.ts`); pure validation rules are tested
  without Nest.
- Integration tests boot `AppModule` and test through HTTP with supertest.
- Before finishing: `pnpm build`, `pnpm lint`, `pnpm test`,
  `pnpm test:integration` must all pass.
