/**
 * Money is computed as integer MINOR units (pence) and only converted to
 * major units at the API boundary. Never use floats for money arithmetic.
 */
export const toMinor = (major: number): number => Math.round(major * 100);
export const toMajor = (minor: number): number => minor / 100;
