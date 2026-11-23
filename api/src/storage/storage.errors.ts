/**
 * A write was based on a version someone else has since changed. Plain Error,
 * not an HTTP exception: storage doesn't know about HTTP, so services
 * translate it to a 409.
 */
export class VersionConflictError extends Error {
  constructor(
    readonly entity: string,
    readonly key: string,
    readonly expectedVersion: number,
    readonly actualVersion: number,
  ) {
    super(
      `${entity} ${key} is at version ${actualVersion}, expected ${expectedVersion}`,
    );
    this.name = 'VersionConflictError';
  }
}
