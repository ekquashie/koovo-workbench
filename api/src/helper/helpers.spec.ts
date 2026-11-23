import { toMajor, toMinor } from './money';

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
