/**
 * One input row exactly as received. Every field stays a string (amounts as
 * decimal strings like "120.00") so they can be parsed straight to pence
 * without passing through a float, and so the original is always inspectable.
 */
export interface RawTransaction {
  record: string;
  client: string;
  source: string;
  sourceId: string;
  type: string;
  status: string;
  supplier: string;
  subtotal: string;
  vat: string;
  total: string;
}
