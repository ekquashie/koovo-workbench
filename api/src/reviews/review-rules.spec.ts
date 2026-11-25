import { SourceStatus } from '../transactions/enums/transaction.enums';
import { ValidationStatus } from '../transactions/enums/validation.enums';
import { ReviewAction, ReviewState } from './enums/review.enums';
import { ReviewRequest, decideReview } from './review-rules';

const { MARK_REVIEWED, MARK_NEEDS_CORRECTION } = ReviewAction;
const { NOT_REVIEWED, REVIEWED, NEEDS_CORRECTION } = ReviewState;
const { VALID, NEEDS_ATTENTION, EXCLUDED } = ValidationStatus;

const req = (over: Partial<ReviewRequest>): ReviewRequest => ({
  action: MARK_REVIEWED,
  recordRef: 'R001',
  sourceStatus: SourceStatus.POSTED,
  validationStatus: VALID,
  issueCount: 0,
  currentState: NOT_REVIEWED,
  ...over,
});

describe('decideReview', () => {
  it.each([
    // action, validation, current state → new state
    [MARK_REVIEWED, VALID, NOT_REVIEWED, REVIEWED],
    [MARK_REVIEWED, VALID, NEEDS_CORRECTION, REVIEWED], // D5
    [MARK_NEEDS_CORRECTION, VALID, NOT_REVIEWED, NEEDS_CORRECTION],
    [MARK_NEEDS_CORRECTION, NEEDS_ATTENTION, NOT_REVIEWED, NEEDS_CORRECTION],
    [MARK_NEEDS_CORRECTION, VALID, REVIEWED, NEEDS_CORRECTION], // reopen
    [
      MARK_NEEDS_CORRECTION,
      NEEDS_ATTENTION,
      NEEDS_CORRECTION,
      NEEDS_CORRECTION,
    ], // new note
  ])(
    'allows %s on a %s record that is %s → %s',
    (action, validationStatus, currentState, toState) => {
      expect(
        decideReview(
          req({
            action,
            validationStatus,
            currentState,
            issueCount: validationStatus === VALID ? 0 : 1,
          }),
        ),
      ).toEqual({ allowed: true, toState });
    },
  );

  it('refuses Reviewed while the record has unresolved issues', () => {
    expect(
      decideReview(
        req({
          recordRef: 'R003',
          validationStatus: NEEDS_ATTENTION,
          issueCount: 1,
        }),
      ),
    ).toEqual({
      allowed: false,
      reason:
        "R003 has 1 unresolved issue and can't be marked Reviewed. Mark it Needs Correction instead.",
    });
  });

  it('counts several issues in the message', () => {
    const decision = decideReview(
      req({ validationStatus: NEEDS_ATTENTION, issueCount: 2 }),
    );
    expect(!decision.allowed && decision.reason).toContain(
      '2 unresolved issues',
    );
  });

  it('refuses Needs Correction → Reviewed while issues remain', () => {
    expect(
      decideReview(
        req({
          validationStatus: NEEDS_ATTENTION,
          issueCount: 1,
          currentState: NEEDS_CORRECTION,
        }),
      ).allowed,
    ).toBe(false);
  });

  it('refuses Reviewed → Reviewed (no change to record)', () => {
    expect(decideReview(req({ currentState: REVIEWED }))).toEqual({
      allowed: false,
      reason: 'R001 is already marked Reviewed.',
    });
  });

  it.each([
    [SourceStatus.DRAFT, 'R006 is Draft, so it is excluded from review.'],
    [SourceStatus.VOID, 'R006 is Void, so it is excluded from review.'],
  ])('refuses every action on a %s record', (sourceStatus, reason) => {
    for (const action of [MARK_REVIEWED, MARK_NEEDS_CORRECTION]) {
      expect(
        decideReview(
          req({
            action,
            recordRef: 'R006',
            sourceStatus,
            validationStatus: EXCLUDED,
          }),
        ),
      ).toEqual({ allowed: false, reason });
    }
  });
});
