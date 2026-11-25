/**
 * Money is computed as integer MINOR units (pence) and only converted to
 * major units at the API boundary. Never use floats for money arithmetic.
 */
export const toMinor = (major: number): number => Math.round(major * 100);
export const toMajor = (minor: number): number => minor / 100;

/** Optional minus, digits, then optionally a dot and 1–2 decimal places. */
const DECIMAL_AMOUNT = /^(-)?(\d+)(?:\.(\d{1,2}))?$/;

/**
 * Parses a decimal string ("120.00", "-6", "0.5") straight to pence using
 * string arithmetic, so the value never passes through a float. Returns null
 * for anything else (more than 2 d.p., thousands separators, "+5", ".5",
 * text), so callers can reject it instead of guessing.
 */
export function parseMinor(value: string): number | null {
  const match = DECIMAL_AMOUNT.exec(value.trim());
  if (!match) return null;
  const [, sign, whole, fraction = ''] = match;
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(minor)) return null;
  // `minor !== 0` keeps "-0.00" as 0 rather than -0.
  return sign && minor !== 0 ? -minor : minor;
}

/** Pence to a 2 d.p. string for messages: 36000 → "360.00", -5 → "-0.05". */
export function formatMinor(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const pence = String(abs % 100).padStart(2, '0');
  return `${sign}${Math.floor(abs / 100)}.${pence}`;
}
