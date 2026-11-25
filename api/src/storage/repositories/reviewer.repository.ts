import { Injectable } from '@nestjs/common';
import { Reviewer } from '../../reviews/entities/reviewer.entity';

/** Fixed mock list (D4); a real system would read users from auth. */
export const MOCK_REVIEWERS: readonly Reviewer[] = [
  new Reviewer({ id: 'rev-eyram', name: 'Eyram Quashie' }),
  new Reviewer({ id: 'rev-shiela', name: 'Shiela Plange' }),
];

export abstract class ReviewerRepository {
  abstract findAll(): Promise<Reviewer[]>;
  abstract findById(id: string): Promise<Reviewer | null>;
}

@Injectable()
export class InMemoryReviewerRepository extends ReviewerRepository {
  findAll(): Promise<Reviewer[]> {
    return Promise.resolve(MOCK_REVIEWERS.map((r) => new Reviewer({ ...r })));
  }

  findById(id: string): Promise<Reviewer | null> {
    const found = MOCK_REVIEWERS.find((r) => r.id === id);
    return Promise.resolve(found ? new Reviewer({ ...found }) : null);
  }
}
