import type {
  IssueCode,
  ReviewActivity,
  TransactionDetail,
  ReviewState,
  SourceStatus,
  TransactionListItem,
  TransactionSummary,
  ValidationStatus,
} from "@/integration";

type Row = [
  ref: string,
  client: string,
  source: "XERO" | "SAGE",
  sourceId: string,
  type: "BILL" | "CREDIT",
  sourceStatus: SourceStatus,
  supplier: string | null,
  subtotal: string | null,
  vat: string | null,
  total: string | null,
  status: ValidationStatus,
  issues: IssueCode[],
];

/** The seeded dataset as the API returns it (R001–R011 → 5 / 4 / 2). */
const ROWS: Row[] = [
  [
    "R001",
    "C01",
    "XERO",
    "X-101",
    "BILL",
    "POSTED",
    "Westline Office",
    "100.00",
    "20.00",
    "120.00",
    "VALID",
    [],
  ],
  [
    "R002",
    "C01",
    "SAGE",
    "S-201",
    "BILL",
    "POSTED",
    "ByteCloud",
    "200.00",
    "40.00",
    "240.00",
    "VALID",
    [],
  ],
  [
    "R003",
    "C01",
    "XERO",
    "X-102",
    "BILL",
    "POSTED",
    "Global Parts",
    "300.00",
    "60.00",
    "365.00",
    "NEEDS_ATTENTION",
    ["TOTAL_MISMATCH"],
  ],
  [
    "R004",
    "C01",
    "SAGE",
    "S-202",
    "BILL",
    "POSTED",
    null,
    "120.00",
    "24.00",
    "144.00",
    "NEEDS_ATTENTION",
    ["MISSING_SUPPLIER"],
  ],
  [
    "R005",
    "C01",
    "XERO",
    "X-101",
    "BILL",
    "POSTED",
    "Westline Office",
    "100.00",
    "20.00",
    "120.00",
    "NEEDS_ATTENTION",
    ["DUPLICATE_SOURCE_TRANSACTION"],
  ],
  [
    "R006",
    "C01",
    "SAGE",
    "S-203",
    "BILL",
    "DRAFT",
    "City Couriers",
    "50.00",
    "10.00",
    "60.00",
    "EXCLUDED",
    [],
  ],
  [
    "R007",
    "C02",
    "XERO",
    "X-101",
    "BILL",
    "POSTED",
    "Westline Office",
    "400.00",
    "80.00",
    "480.00",
    "VALID",
    [],
  ],
  [
    "R008",
    "C01",
    "XERO",
    "X-103",
    "BILL",
    "POSTED",
    "Delta Supplies",
    "90.00",
    "18.00",
    "108.00",
    "VALID",
    [],
  ],
  [
    "R009",
    "C01",
    "SAGE",
    "S-204",
    "BILL",
    "VOID",
    "Widgets Ltd",
    "80.00",
    "0.00",
    "80.00",
    "EXCLUDED",
    [],
  ],
  [
    "R010",
    "C01",
    "XERO",
    "X-104",
    "CREDIT",
    "POSTED",
    "Caldera",
    "-100.00",
    "-20.00",
    "-120.00",
    "VALID",
    [],
  ],
  [
    "R011",
    "C01",
    "XERO",
    "X-105",
    "BILL",
    "POSTED",
    "Alpha Inc",
    "-30.00",
    "-6.00",
    "-36.00",
    "NEEDS_ATTENTION",
    ["INVALID_AMOUNT_SIGN"],
  ],
];

const pence = (value: string | null) =>
  value === null ? null : Number(value.replace(".", ""));

export function makeItem(
  row: Row,
  reviewState: ReviewState = "NOT_REVIEWED",
): TransactionListItem {
  const [
    ref,
    client,
    source,
    sourceId,
    type,
    sourceStatus,
    supplier,
    subtotal,
    vat,
    total,
    status,
    issues,
  ] = row;
  return {
    id: `id-${ref}`,
    sequence: Number(ref.slice(1)),
    recordRef: ref,
    clientId: client,
    source,
    sourceId,
    type,
    sourceStatus,
    supplierName: supplier,
    amounts: {
      subtotal,
      vat,
      total,
      subtotalMinor: pence(subtotal),
      vatMinor: pence(vat),
      totalMinor: pence(total),
    },
    validation: {
      status,
      issues: issues.map((code) => ({
        code,
        message: `${code} on ${ref}`,
        fields: [],
        relatedRecordIds: [],
      })),
      processed: status === "VALID",
      validatedAt: "2026-11-23T10:00:00.000Z",
    },
    review: {
      state: reviewState,
      note: null,
      updatedBy: null,
      updatedAt: null,
      version: 0,
    },
    receivedAt: "2026-11-23T10:00:00.000Z",
  };
}

export const ITEMS: TransactionListItem[] = ROWS.map((row) => makeItem(row));
// R005 is a repeat of R001, as the API reports it.
ITEMS[4].validation.issues[0].relatedRecordIds = ["id-R001"];
ITEMS[4].validation.issues[0].message =
  "Exact repeat of R001 (same client, source, source ID and values). Kept for inspection, not processed again.";
ITEMS[2].validation.issues[0].fields = ["total"];

const SOURCE_RAW = { XERO: "Xero", SAGE: "Sage" } as const;
const TYPE_RAW = { BILL: "Bill", CREDIT: "Credit" } as const;
const STATUS_RAW = { POSTED: "Posted", DRAFT: "Draft", VOID: "Void" } as const;

/** The detail response for a list item, with raw input as the source sent it. */
export function makeDetail(
  item: TransactionListItem,
  all: TransactionListItem[],
  activity: ReviewActivity[] = [],
): TransactionDetail {
  const relatedIds = [
    ...new Set(item.validation.issues.flatMap((i) => i.relatedRecordIds)),
  ];
  return {
    ...item,
    importId: "batch-1",
    identityKey: `${item.clientId}|${item.source}|${item.sourceId}`,
    raw: {
      record: item.recordRef,
      client: item.clientId,
      source: SOURCE_RAW[item.source],
      sourceId: item.sourceId,
      type: TYPE_RAW[item.type],
      status: STATUS_RAW[item.sourceStatus],
      supplier: item.supplierName ?? "-",
      subtotal: item.amounts.subtotal ?? "-",
      vat: item.amounts.vat ?? "-",
      total: item.amounts.total ?? "-",
    },
    relatedRecords: relatedIds.map((id) => ({
      id,
      recordRef: all.find((i) => i.id === id)?.recordRef ?? id,
    })),
    activity,
  };
}

export function summaryOf(
  items: TransactionListItem[],
  clientId?: string,
): TransactionSummary {
  const scoped = items.filter((i) => !clientId || i.clientId === clientId);
  const counts = { VALID: 0, NEEDS_ATTENTION: 0, EXCLUDED: 0 };
  for (const i of scoped) counts[i.validation.status] += 1;
  return {
    counts,
    total: scoped.length,
    clients: [...new Set(items.map((i) => i.clientId))].sort(),
  };
}

export const REVIEWERS = [
  { id: "rev-eyram", name: "Eyram Quashie" },
  { id: "rev-shiela", name: "Shiela Plange" },
];
