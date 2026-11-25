import { ReviewAction, ReviewState } from '../enums/review.enums';

/** Append-only history entry for one accepted review action. */
export class ReviewActivity {
  id!: string;
  recordId!: string;
  action!: ReviewAction;
  fromState!: ReviewState;
  toState!: ReviewState;
  note!: string | null;
  reviewerId!: string;
  createdAt!: string;

  constructor(props: ReviewActivity) {
    Object.assign(this, props);
  }
}
