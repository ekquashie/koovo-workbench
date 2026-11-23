import { formatMinor, parseMinor, toMajor, toMinor } from './money';

describe('money', () => {
  it('converts major to minor units without float drift', () => {
    expect(toMinor(0.1 + 0.2)).toBe(30);
    expect(toMinor(365)).toBe(36500);
    expect(toMinor(-120)).toBe(-12000);
  });

  it('converts minor back to major units', () => {
    expect(toMajor(36500)).toBe(365);
  });
});

describe('parseMinor', () => {
  it.each([
    ['120.00', 12000],
    ['-6', -600],
    ['0.5', 50],
    ['0.05', 5],
    [' 365.00 ', 36500],
    ['-0.00', 0],
  ])('parses %p to %p pence', (input, expected) => {
    expect(parseMinor(input)).toBe(expected);
  });

  it('never produces -0', () => {
    expect(Object.is(parseMinor('-0.00'), 0)).toBe(true);
  });

  it('adds up exactly where floats would not', () => {
    expect(parseMinor('0.10')! + parseMinor('0.20')!).toBe(parseMinor('0.30'));
  });

  it.each([
    '',
    '-',
    'abc',
    '1.234',
    '1,000.00',
    '+5',
    '.5',
    '1.',
    '1e3',
    '99999999999999999',
  ])('rejects %p', (input) => {
    expect(parseMinor(input)).toBeNull();
  });
});

describe('formatMinor', () => {
  it.each([
    [36000, '360.00'],
    [-3000, '-30.00'],
    [5, '0.05'],
    [-5, '-0.05'],
    [0, '0.00'],
  ])('formats %p as %p', (minor, expected) => {
    expect(formatMinor(minor)).toBe(expected);
  });
});
