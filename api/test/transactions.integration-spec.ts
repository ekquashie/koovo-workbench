import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/app.setup';
import { SeedService } from '../src/imports/seed.service';
import { ReviewState } from '../src/reviews/enums/review.enums';
import { ReviewRepository } from '../src/storage/repositories/review.repository';
import { loadSeedRows } from '../src/testing/fixtures';

type Item = {
  id: string;
  recordRef: string;
  validation: { status: string; issues: { code: string }[] };
};

describe('Transactions (integration)', () => {
  let app: INestApplication;
  /** recordRef → id, from the seeded dataset. */
  const ids = new Map<string, string>();

  const get = (path: string) =>
    request(app.getHttpServer()).get(`/api/v1${path}`);
  const refs = (items: Item[]) => items.map((i) => i.recordRef);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const { recordIds } = await app.get(SeedService).seed();
    loadSeedRows().forEach((row, i) => ids.set(row.record, recordIds[i]));
  });

  afterAll(() => app.close());

  describe('GET /transactions', () => {
    it('lists every record in arrival order, repeats included', async () => {
      const res = await get('/transactions').expect(200);
      expect(refs(res.body.data)).toEqual([
        'R001',
        'R002',
        'R003',
        'R004',
        'R005',
        'R006',
        'R007',
        'R008',
        'R009',
        'R010',
        'R011',
      ]);
    });

    it('returns validation, review state and both forms of each amount', async () => {
      const res = await get('/transactions').expect(200);
      const r010 = res.body.data.find((i: Item) => i.recordRef === 'R010');
      expect(r010).toMatchObject({
        id: ids.get('R010'),
        clientId: 'C01',
        source: 'XERO',
        sourceId: 'X-104',
        type: 'CREDIT',
        sourceStatus: 'POSTED',
        supplierName: 'Caldera',
        amounts: {
          subtotal: '-100.00',
          vat: '-20.00',
          total: '-120.00',
          subtotalMinor: -10000,
          vatMinor: -2000,
          totalMinor: -12000,
        },
        validation: { status: 'VALID', issues: [], processed: true },
        review: { state: 'NOT_REVIEWED', version: 0 },
      });
    });

    it('shows a missing supplier as null', async () => {
      const res = await get('/transactions').expect(200);
      const r004 = res.body.data.find((i: Item) => i.recordRef === 'R004');
      expect(r004.supplierName).toBeNull();
      expect(r004.validation.issues[0].code).toBe('MISSING_SUPPLIER');
    });

    it.each([
      ['?status=VALID', ['R001', 'R002', 'R007', 'R008', 'R010']],
      ['?status=NEEDS_ATTENTION', ['R003', 'R004', 'R005', 'R011']],
      ['?status=EXCLUDED', ['R006', 'R009']],
      ['?status=needs_attention', ['R003', 'R004', 'R005', 'R011']],
      ['?clientId=C02', ['R007']],
      ['?clientId=C01&status=VALID', ['R001', 'R002', 'R008', 'R010']],
      ['?clientId=C02&status=EXCLUDED', []],
      ['?clientId=C99', []],
    ])('filters %s', async (query, expected) => {
      const res = await get(`/transactions${query}`).expect(200);
      expect(refs(res.body.data)).toEqual(expected);
    });

    it('treats empty filters as no filter', async () => {
      const res = await get('/transactions?clientId=&status=').expect(200);
      expect(res.body.data).toHaveLength(11);
    });

    it('400 for an unknown status, naming the allowed values', async () => {
      const res = await get('/transactions?status=PENDING').expect(400);
      expect(res.body.errors.status).toBe(
        'status must be one of: VALID, NEEDS_ATTENTION, EXCLUDED',
      );
    });
  });

  describe('GET /transactions/summary', () => {
    it('counts the whole dataset as 5 / 4 / 2 and lists every client', async () => {
      const res = await get('/transactions/summary').expect(200);
      expect(res.body.data).toEqual({
        counts: { VALID: 5, NEEDS_ATTENTION: 4, EXCLUDED: 2 },
        total: 11,
        clients: ['C01', 'C02'],
      });
    });

    it('counts one client but still lists every client', async () => {
      const res = await get('/transactions/summary?clientId=C01').expect(200);
      expect(res.body.data).toEqual({
        counts: { VALID: 4, NEEDS_ATTENTION: 4, EXCLUDED: 2 },
        total: 10,
        clients: ['C01', 'C02'],
      });
    });
  });

  describe('GET /transactions/:id', () => {
    it('shows a repeat with the raw input and a link to the original', async () => {
      const res = await get(`/transactions/${ids.get('R005')}`).expect(200);
      const detail = res.body.data;

      expect(detail.raw).toEqual(loadSeedRows()[4]);
      expect(detail.identityKey).toBe('C01|XERO|X-101');
      expect(detail.importId).toEqual(expect.any(String));
      expect(detail.validation).toMatchObject({
        status: 'NEEDS_ATTENTION',
        processed: false,
      });
      expect(detail.validation.issues).toEqual([
        expect.objectContaining({
          code: 'DUPLICATE_SOURCE_TRANSACTION',
          relatedRecordIds: [ids.get('R001')],
        }),
      ]);
      expect(detail.relatedRecords).toEqual([
        { id: ids.get('R001'), recordRef: 'R001' },
      ]);
      expect(detail.activity).toEqual([]);
    });

    it('explains R003 in accountant terms', async () => {
      const res = await get(`/transactions/${ids.get('R003')}`).expect(200);
      expect(res.body.data.validation.issues).toEqual([
        {
          code: 'TOTAL_MISMATCH',
          message:
            'Total 365.00 does not equal subtotal 300.00 + VAT 60.00 (360.00).',
          fields: ['total'],
          relatedRecordIds: [],
        },
      ]);
      expect(res.body.data.relatedRecords).toEqual([]);
    });

    it('shows an excluded record with no issues', async () => {
      const res = await get(`/transactions/${ids.get('R006')}`).expect(200);
      expect(res.body.data.validation).toMatchObject({
        status: 'EXCLUDED',
        issues: [],
        processed: false,
      });
      expect(res.body.data.raw.status).toBe('Draft');
    });

    it('404 in the standard envelope for an unknown id', async () => {
      const res = await get('/transactions/not-a-real-id').expect(404);
      expect(res.body).toEqual({
        code: 404,
        message: 'Transaction not found',
        data: null,
      });
    });
  });

  describe('review state is joined in, separate from validation', () => {
    it('shows a stored review on the list and the detail', async () => {
      const id = ids.get('R002')!;
      await app.get(ReviewRepository).save(
        {
          recordId: id,
          state: ReviewState.REVIEWED,
          note: null,
          updatedBy: 'rev-eyram',
          updatedAt: '2026-11-23T12:00:00.000Z',
        },
        0,
      );

      const list = await get('/transactions?status=VALID').expect(200);
      const r002 = list.body.data.find((i: Item) => i.recordRef === 'R002');
      expect(r002.review).toEqual({
        state: 'REVIEWED',
        note: null,
        updatedBy: 'rev-eyram',
        updatedAt: '2026-11-23T12:00:00.000Z',
        version: 1,
      });
      expect(r002.validation.status).toBe('VALID');

      const detail = await get(`/transactions/${id}`).expect(200);
      expect(detail.body.data.review.state).toBe('REVIEWED');
    });
  });
});
