export enum SourceSystem {
  XERO = 'XERO',
  SAGE = 'SAGE',
}

export enum TransactionType {
  BILL = 'BILL',
  CREDIT = 'CREDIT',
}

/** Status in the source system. Only POSTED records are validated. */
export enum SourceStatus {
  POSTED = 'POSTED',
  DRAFT = 'DRAFT',
  VOID = 'VOID',
}
