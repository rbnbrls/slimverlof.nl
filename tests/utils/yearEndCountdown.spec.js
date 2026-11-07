import { describe, expect, it } from 'vitest';
import { getYearEndCountdown } from '../../src/utils/yearEndCountdown.js';

describe('getYearEndCountdown', () => {
  it('returns the days until next January during November and December', () => {
    expect(getYearEndCountdown(new Date(2026, 10, 7))).toEqual({ days: 55, year: 2027 });
    expect(getYearEndCountdown(new Date(2026, 11, 31))).toEqual({ days: 1, year: 2027 });
  });

  it('is hidden outside the final two months of the year', () => {
    expect(getYearEndCountdown(new Date(2026, 9, 31))).toBeNull();
    expect(getYearEndCountdown(new Date(2027, 0, 1))).toBeNull();
  });
});
