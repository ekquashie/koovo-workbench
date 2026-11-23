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
  trim strings with `@Transform(trim)`.
- **Versioning:** `/api/v1/...`; only health is `VERSION_NEUTRAL`.
- **Money:** compare and sum in integer minor units (`toMinor`), never floats.
- **Config:** new env vars go in `config/configuration.ts` **and** `.env.example`.
- Short doc comments that explain *why*; no noise comments.

## Testing

- Unit tests next to code (`*.spec.ts`); pure validation rules are tested
  without Nest.
- Integration tests boot `AppModule` and test through HTTP with supertest.
- Before finishing: `pnpm build`, `pnpm lint`, `pnpm test`,
  `pnpm test:integration` must all pass.
