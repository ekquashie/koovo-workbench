import { SourceStatus } from '../transactions/enums/transaction.enums';
import { ValidationStatus } from '../transactions/enums/validation.enums';
import { ReviewAction, ReviewState } from './enums/review.enums';

export interface ReviewRequest {
  action: ReviewAction;
  recordRef: string;
  sourceStatus: SourceStatus;
  validationStatus: ValidationStatus;
  issueCount: number;
  currentState: ReviewState;
}

export type ReviewDecision =
  { allowed: true; toState: ReviewState } | { allowed: false; reason: string };

const LABEL: Record<SourceStatus, string> = {
  [SourceStatus.POSTED]: 'Posted',
  [SourceStatus.DRAFT]: 'Draft',
  [SourceStatus.VOID]: 'Void',
};

/**
 * The review rules from the brief, as one pure function so every case can be
 * unit-tested without HTTP. The note requirement for Needs Correction is a
 * form rule and lives in the DTO.
 *
 * - Excluded (Draft/Void): no review actions at all.
 * - Mark Reviewed: only a VALID record (no unresolved issues). That also
 *   covers Needs Correction → Reviewed once the record is valid (D5).
 * - Mark Needs Correction: any posted record, repeatable to update the note.
 * - Reviewed → Reviewed is refused: it would add history without a change.
 */
export function decideReview(req: ReviewRequest): ReviewDecision {
  if (req.sourceStatus !== SourceStatus.POSTED) {
    return {
      allowed: false,
      reason: `${req.recordRef} is ${LABEL[req.sourceStatus]}, so it is excluded from review.`,
    };
  }

  if (req.action === ReviewAction.MARK_NEEDS_CORRECTION) {
    return { allowed: true, toState: ReviewState.NEEDS_CORRECTION };
  }

  if (req.validationStatus !== ValidationStatus.VALID) {
    const issues =
      req.issueCount === 1
        ? '1 unresolved issue'
        : `${req.issueCount} unresolved issues`;
    return {
      allowed: false,
      reason:
        `${req.recordRef} has ${issues} and can't be marked Reviewed. ` +
        `Mark it Needs Correction instead.`,
    };
  }
  if (req.currentState === ReviewState.REVIEWED) {
    return {
      allowed: false,
      reason: `${req.recordRef} is already marked Reviewed.`,
    };
  }
  return { allowed: true, toState: ReviewState.REVIEWED };
}
