import { ReviewState } from '../reviews/enums/review.enums';
import { aRaw, aReview, recordsFromRaw } from '../testing/fixtures';
import { Review } from '../reviews/entities/review.entity';
import { toAmounts, toReviewState } from './transactions.mapper';

describe('transactions mapper', () => {
  it('sends amounts as pence and as 2 d.p. strings', () => {
    const [record] = recordsFromRaw([
      aRaw({ subtotal: '-100', vat: '-20.5', total: '-120.50' }),
    ]);
    expect(toAmounts(record)).toEqual({
      subtotal: '-100.00',
      vat: '-20.50',
      total: '-120.50',
      subtotalMinor: -10000,
      vatMinor: -2050,
      totalMinor: -12050,
    });
  });

  it('keeps a missing amount as null in both forms, never "0.00"', () => {
    const [record] = recordsFromRaw([aRaw({ vat: '-' })]);
    expect(toAmounts(record)).toMatchObject({ vat: null, vatMinor: null });
  });

  it('reports NOT_REVIEWED at version 0 when there is no review', () => {
    expect(toReviewState(null)).toEqual({
      state: ReviewState.NOT_REVIEWED,
      note: null,
      updatedBy: null,
      updatedAt: null,
      version: 0,
    });
  });

  it('passes a stored review through', () => {
    const review = new Review({ ...aReview({ note: 'ok' }), version: 3 });
    expect(toReviewState(review)).toMatchObject({
      state: ReviewState.REVIEWED,
      note: 'ok',
      version: 3,
    });
  });
});
