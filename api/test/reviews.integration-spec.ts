import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/config/app.setup';
import { SeedService } from '../src/imports/seed.service';
import { aRaw, loadSeedRows } from '../src/testing/fixtures';

describe('Reviews (integration)', () => {
  let app: INestApplication;
  const ids = new Map<string, string>();

  const server = () => app.getHttpServer();
  const review = (
    ref: string,
    body: object,
    reviewer: string | null = 'rev-ama',
  ) => {
    const req = request(server()).post(
      `/api/v1/transactions/${ids.get(ref) ?? ref}/reviews`,
    );
    return (reviewer === null ? req : req.set('X-Reviewer-Id', reviewer)).send(
      body,
    );
  };
  const detail = async (ref: string) =>
    (
      await request(server())
        .get(`/api/v1/transactions/${ids.get(ref)}`)
        .expect(200)
    ).body.data;

  const reviewed = (expectedVersion = 0, note?: string) => ({
    action: 'MARK_REVIEWED',
    expectedVersion,
    ...(note === undefined ? {} : { note }),
  });
  const needsCorrection = (note: string | undefined, expectedVersion = 0) => ({
    action: 'MARK_NEEDS_CORRECTION',
    expectedVersion,
    ...(note === undefined ? {} : { note }),
  });

  /** Fresh, seeded app per test: review state never leaks between tests. */
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    const { recordIds } = await app.get(SeedService).seed();
    ids.clear();
    loadSeedRows().forEach((row, i) => ids.set(row.record, recordIds[i]));
  });
  afterEach(() => app.close());

  describe('GET /reviewers', () => {
    it('lists the mock reviewers', async () => {
      const res = await request(server()).get('/api/v1/reviewers').expect(200);
      expect(res.body.data).toEqual([
        { id: 'rev-ama', name: 'Ama Mensah' },
        { id: 'rev-kofi', name: 'Kofi Asante' },
      ]);
    });
  });

  describe('reviewer identity', () => {
    it('401 without X-Reviewer-Id', async () => {
      const res = await review('R001', reviewed(), null).expect(401);
      expect(res.body.message).toBe(
        'Choose a reviewer first (send the X-Reviewer-Id header).',
      );
    });

    it('401 for an unknown reviewer', async () => {
      const res = await review('R001', reviewed(), 'rev-nobody').expect(401);
      expect(res.body.message).toBe('Unknown reviewer "rev-nobody".');
    });

    it('records who acted', async () => {
      const res = await review('R001', reviewed(), 'rev-kofi').expect(201);
      expect(res.body.data.review.updatedBy).toBe('rev-kofi');
      expect(res.body.data.activity.reviewerId).toBe('rev-kofi');
    });
  });

  describe('Mark Reviewed', () => {
    it('marks a valid posted record Reviewed and records the history', async () => {
      const res = await review('R001', reviewed()).expect(201);

      expect(res.body.message).toBe('Review recorded');
      expect(res.body.data.review).toEqual({
        state: 'REVIEWED',
        note: null,
        updatedBy: 'rev-ama',
        updatedAt: expect.any(String),
        version: 1,
      });
      expect(res.body.data.activity).toEqual({
        id: expect.any(String),
        action: 'MARK_REVIEWED',
        fromState: 'NOT_REVIEWED',
        toState: 'REVIEWED',
        note: null,
        reviewerId: 'rev-ama',
        createdAt: res.body.data.review.updatedAt,
      });

      const r001 = await detail('R001');
      expect(r001.review.state).toBe('REVIEWED');
      expect(r001.activity).toHaveLength(1);
    });

    it('keeps review state separate from validation status', async () => {
      await review('R001', reviewed()).expect(201);
      const r001 = await detail('R001');
      expect(r001.validation.status).toBe('VALID');

      const summary = await request(server())
        .get('/api/v1/transactions/summary')
        .expect(200);
      expect(summary.body.data.counts).toEqual({
        VALID: 5,
        NEEDS_ATTENTION: 4,
        EXCLUDED: 2,
      });
    });

    it.each(['R003', 'R004', 'R005', 'R011'])(
      '422 for %s, which has unresolved issues, and adds no history',
      async (ref) => {
        const res = await review(ref, reviewed()).expect(422);
        expect(res.body.message).toBe(
          `${ref} has 1 unresolved issue and can't be marked Reviewed. Mark it Needs Correction instead.`,
        );
        expect((await detail(ref)).activity).toEqual([]);
      },
    );

    it('422 when already Reviewed', async () => {
      await review('R001', reviewed()).expect(201);
      const res = await review('R001', reviewed(1)).expect(422);
      expect(res.body.message).toBe('R001 is already marked Reviewed.');
    });

    it('accepts an optional note', async () => {
      const res = await review(
        'R001',
        reviewed(0, '  Matches invoice  '),
      ).expect(201);
      expect(res.body.data.review.note).toBe('Matches invoice');
    });
  });

  describe('Mark Needs Correction', () => {
    it('marks a record with issues, keeping the trimmed note', async () => {
      const res = await review(
        'R003',
        needsCorrection('  Total is 5.00 too high  '),
      ).expect(201);
      expect(res.body.data.review).toMatchObject({
        state: 'NEEDS_CORRECTION',
        note: 'Total is 5.00 too high',
        version: 1,
      });
    });

    it('can be used on a valid record too', async () => {
      await review('R002', needsCorrection('Wrong supplier account')).expect(
        201,
      );
    });

    it.each([
      [
        'missing',
        undefined,
        'Add a short note explaining what needs correcting.',
      ],
      ['blank', '    ', 'Add a short note explaining what needs correcting.'],
      ['too short', ' ab ', 'The note must be at least 3 characters.'],
      ['too long', 'x'.repeat(501), 'The note must be at most 500 characters.'],
    ])('400 when the note is %s', async (_case, note, message) => {
      const res = await review('R003', needsCorrection(note)).expect(400);
      expect(res.body.errors).toEqual({ note: message });
      expect((await detail('R003')).activity).toEqual([]);
    });

    it('can update the note by marking it again', async () => {
      await review('R003', needsCorrection('First note')).expect(201);
      const res = await review(
        'R003',
        needsCorrection('Second note', 1),
      ).expect(201);
      expect(res.body.data.review).toMatchObject({
        note: 'Second note',
        version: 2,
      });
      expect((await detail('R003')).activity).toHaveLength(2);
    });
  });

  describe('Needs Correction → Reviewed (D5)', () => {
    it('is allowed once the record is valid, and the history keeps both steps', async () => {
      await review('R001', needsCorrection('Check with client')).expect(201);
      await review('R001', reviewed(1), 'rev-kofi').expect(201);

      const history = (await detail('R001')).activity;
      expect(
        history.map(
          (a: { fromState: string; toState: string; reviewerId: string }) => [
            a.fromState,
            a.toState,
            a.reviewerId,
          ],
        ),
      ).toEqual([
        ['NOT_REVIEWED', 'NEEDS_CORRECTION', 'rev-ama'],
        ['NEEDS_CORRECTION', 'REVIEWED', 'rev-kofi'],
      ]);
    });

    it('is refused while issues remain', async () => {
      await review('R003', needsCorrection('Check total')).expect(201);
      await review('R003', reviewed(1)).expect(422);
    });
  });

  describe('excluded records', () => {
    it.each([
      ['R006', 'Draft'],
      ['R009', 'Void'],
    ])('422 for %s (%s) on every action', async (ref, label) => {
      for (const body of [
        reviewed(),
        needsCorrection('Should not be allowed'),
      ]) {
        const res = await review(ref, body).expect(422);
        expect(res.body.message).toBe(
          `${ref} is ${label}, so it is excluded from review.`,
        );
      }
      expect((await detail(ref)).activity).toEqual([]);
    });
  });

  describe('stale screens (optimistic concurrency)', () => {
    it('409 when someone else changed the review first, and keeps their decision', async () => {
      await review('R002', reviewed(0), 'rev-ama').expect(201);

      // Kofi's screen still shows version 0.
      const res = await review(
        'R002',
        needsCorrection('Looks off', 0),
        'rev-kofi',
      ).expect(409);
      expect(res.body.message).toBe(
        'R002 was updated by Ama Mensah since you loaded it. Reload to see the latest decision.',
      );

      const r002 = await detail('R002');
      expect(r002.review).toMatchObject({
        state: 'REVIEWED',
        updatedBy: 'rev-ama',
        version: 1,
      });
      expect(r002.activity).toHaveLength(1);
    });

    it('409 when the client claims a version that does not exist yet', async () => {
      await review('R001', reviewed(5)).expect(409);
    });

    it('lets exactly one of two simultaneous decisions win', async () => {
      const results = await Promise.all([
        review('R001', reviewed(0), 'rev-ama'),
        review('R001', needsCorrection('Hold on', 0), 'rev-kofi'),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect((await detail('R001')).activity).toHaveLength(1);
    });
  });

  describe('request errors', () => {
    it('404 for an unknown record', async () => {
      const res = await review('no-such-id', reviewed()).expect(404);
      expect(res.body.message).toBe('Transaction not found');
    });

    it('400 for an unknown action', async () => {
      const res = await review('R001', {
        action: 'APPROVE',
        expectedVersion: 0,
      }).expect(400);
      expect(res.body.errors.action).toBe(
        'action must be one of: MARK_REVIEWED, MARK_NEEDS_CORRECTION',
      );
    });

    it('400 without expectedVersion', async () => {
      const res = await review('R001', { action: 'MARK_REVIEWED' }).expect(400);
      expect(Object.keys(res.body.errors)).toEqual(['expectedVersion']);
    });
  });

  describe('GET /transactions/:id/activity', () => {
    it('returns the history oldest first', async () => {
      await review('R003', needsCorrection('First')).expect(201);
      await review('R003', needsCorrection('Second', 1)).expect(201);
      const res = await request(server())
        .get(`/api/v1/transactions/${ids.get('R003')}/activity`)
        .expect(200);
      expect(res.body.data.map((a: { note: string }) => a.note)).toEqual([
        'First',
        'Second',
      ]);
    });

    it('404 for an unknown record', async () => {
      await request(server())
        .get('/api/v1/transactions/nope/activity')
        .expect(404);
    });
  });

  describe('when validation changes after a review', () => {
    it('keeps the review but the record now shows its new issues', async () => {
      await review('R008', reviewed()).expect(201);

      // A conflicting version of X-103 arrives later.
      await request(server())
        .post('/api/v1/imports')
        .send({
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
        })
        .expect(201);

      const r008 = await detail('R008');
      expect(r008.review.state).toBe('REVIEWED');
      expect(r008.validation.status).toBe('NEEDS_ATTENTION');
      expect(r008.validation.issues[0].code).toBe(
        'CONFLICTING_SOURCE_TRANSACTION',
      );
    });
  });
});
