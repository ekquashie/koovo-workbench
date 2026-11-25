import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/app.setup';
import { SeedService } from '../src/imports/seed.service';
import { aRaw, loadSeedRows } from '../src/testing/fixtures';

/** Fresh app (and so fresh in-memory storage) per test. */
async function bootApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

describe('Imports (integration)', () => {
  let app: INestApplication;
  const post = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/v1/imports')
      .send(body as object);
  const listImports = () =>
    request(app.getHttpServer()).get('/api/v1/imports').expect(200);

  beforeEach(async () => {
    app = await bootApp();
  });
  afterEach(() => app.close());

  describe('POST /api/v1/imports', () => {
    it('imports the brief’s dataset: 5 valid / 4 needs attention / 2 excluded', async () => {
      const res = await post({ records: loadSeedRows() }).expect(201);

      expect(res.body.code).toBe(201);
      expect(res.body.message).toBe('Import accepted');
      expect(res.body.data.summary).toEqual({
        VALID: 5,
        NEEDS_ATTENTION: 4,
        EXCLUDED: 2,
      });
      expect(res.body.data.recordIds).toHaveLength(11);
      expect(res.body.data.import).toMatchObject({
        origin: 'API',
        recordCount: 11,
      });
    });

    it('re-validates old records: a new import can turn a valid record into a conflict', async () => {
      await post({ records: loadSeedRows() }).expect(201);

      // Same client/source/ID as R008 (valid) but different amounts.
      const res = await post({
        records: [
          aRaw({
            record: 'R012',
            sourceId: 'X-103',
            supplier: 'Delta Supplies',
            subtotal: '95.00',
            vat: '19.00',
            total: '114.00',
          }),
        ],
      }).expect(201);

      // R008 leaves VALID; R008 and R012 both need attention.
      expect(res.body.data.summary).toEqual({
        VALID: 4,
        NEEDS_ATTENTION: 6,
        EXCLUDED: 2,
      });
    });

    it('never double-processes: re-sending the same dataset only adds flagged repeats', async () => {
      await post({ records: loadSeedRows() }).expect(201);
      const res = await post({ records: loadSeedRows() }).expect(201);

      // The 9 re-sent posted rows are exact repeats; valid count is unchanged.
      expect(res.body.data.summary).toEqual({
        VALID: 5,
        NEEDS_ATTENTION: 13,
        EXCLUDED: 4,
      });
    });

    it('rejects the whole import if any row is malformed, and stores nothing', async () => {
      const res = await post({
        records: [
          aRaw({ record: 'R001' }),
          aRaw({ record: 'R002', total: '12.345', source: 'QuickBooks' }),
        ],
      }).expect(400);

      expect(res.body).toMatchObject({ code: 400, data: null });
      expect(res.body.errors).toEqual({
        'records.1.source':
          'R002: Source "QuickBooks" is not one of: xero, sage',
        'records.1.total':
          'R002: Total "12.345" is not a valid amount (e.g. 120.00)',
      });
      expect(res.body.message).toBe(Object.values(res.body.errors)[0]);

      expect((await listImports()).body.data).toEqual([]);
      const next = await post({ records: [aRaw()] }).expect(201);
      expect(next.body.data.summary).toEqual({
        VALID: 1,
        NEEDS_ATTENTION: 0,
        EXCLUDED: 0,
      });
    });

    it('accepts missing values ("-") and flags them instead of rejecting', async () => {
      const res = await post({
        records: [aRaw({ supplier: '-', vat: '-' })],
      }).expect(201);
      expect(res.body.data.summary.NEEDS_ATTENTION).toBe(1);
    });

    it.each([
      ['no body', {}, 'records'],
      ['records is not a list', { records: 'R001' }, 'records'],
      ['an empty list', { records: [] }, 'records'],
    ])('400 for %s', async (_case, body, key) => {
      const res = await post(body).expect(400);
      expect(Object.keys(res.body.errors)).toContain(key);
    });

    it('400 when an amount is a JSON number rather than a string', async () => {
      const res = await post({
        records: [{ ...aRaw(), subtotal: 100 }],
      }).expect(400);
      expect(res.body.errors['records.0.subtotal']).toBe(
        'subtotal must be text, e.g. "120.00" or "-" for missing',
      );
    });

    it('400 when a column is absent', async () => {
      const row: Partial<ReturnType<typeof aRaw>> = aRaw();
      delete row.supplier;
      const res = await post({ records: [row] }).expect(400);
      expect(Object.keys(res.body.errors)).toEqual(['records.0.supplier']);
    });

    it('400 for more than 1000 records in one request', async () => {
      const records = Array.from({ length: 1001 }, (_, i) =>
        aRaw({ record: `R${i}`, sourceId: `X-${i}` }),
      );
      const res = await post({ records }).expect(400);
      expect(res.body.errors.records).toContain('at most 1000');
    });

    it('runs concurrent imports one at a time, so no records are lost from validation', async () => {
      const [a, b] = await Promise.all([
        post({ records: [aRaw({ record: 'A', sourceId: 'X-1' })] }),
        post({ records: [aRaw({ record: 'B', sourceId: 'X-1' })] }),
      ]);
      expect([a.status, b.status]).toEqual([201, 201]);

      // Whichever finished last saw both records: one valid, one duplicate.
      const last = [a, b].find(
        (r) =>
          r.body.data.summary.VALID + r.body.data.summary.NEEDS_ATTENTION === 2,
      );
      expect(last?.body.data.summary).toEqual({
        VALID: 1,
        NEEDS_ATTENTION: 1,
        EXCLUDED: 0,
      });
    });
  });

  describe('GET /api/v1/imports', () => {
    it('lists import batches oldest first', async () => {
      await post({ records: [aRaw()] }).expect(201);
      await post({ records: [aRaw(), aRaw({ record: 'R002' })] }).expect(201);

      const res = await listImports();
      expect(
        res.body.data.map((b: { recordCount: number }) => b.recordCount),
      ).toEqual([1, 2]);
      expect(res.body.data[0]).toEqual({
        id: expect.any(String),
        origin: 'API',
        recordCount: 1,
        importedAt: expect.any(String),
      });
    });
  });

  describe('seeding', () => {
    it('loads the bundled dataset through the same import path', async () => {
      const result = await app.get(SeedService).seed();
      expect(result.summary).toEqual({
        VALID: 5,
        NEEDS_ATTENTION: 4,
        EXCLUDED: 2,
      });

      const res = await listImports();
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0]).toMatchObject({
        origin: 'SEED',
        recordCount: 11,
      });
    });

    it('does not seed when SEED_ON_STARTUP=false (as in these tests)', async () => {
      expect((await listImports()).body.data).toEqual([]);
    });
  });
});

describe('Imports body size (integration)', () => {
  it('rejects a body over 1mb with 413 in the standard envelope', async () => {
    const app = await bootApp();
    const records = Array.from({ length: 1000 }, () =>
      aRaw({ supplier: 'x'.repeat(200) }),
    );
    const res = await request(app.getHttpServer())
      .post('/api/v1/imports')
      .send({ records, padding: 'y'.repeat(1_100_000) })
      .expect(413);
    expect(res.body).toMatchObject({ code: 413, data: null });
    await app.close();
  });
});
