import { describe, expect, it } from 'vitest';
import {
  calculateBestRange,
  findBestRatioRanges,
  findCheapestRange,
} from '../../src/utils/calculator.js';

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const workdays = [1, 2, 3, 4, 5];

describe('calculateBestRange', () => {
  it('returns the longest free range that fits the vacation budget', () => {
    const result = calculateBestRange(new Date(2025, 3, 1), 2, workdays, new Date(2025, 4, 31));

    // 16-17 April are booked, 18 April is Good Friday, then the Easter weekend.
    expect(iso(result.start)).toBe('2025-04-16');
    expect(iso(result.end)).toBe('2025-04-21');
    expect(result.totalDays).toBe(6);
    expect(result.cost).toBe(2);
    expect(result.days).toHaveLength(6);
    expect(result.days.filter((day) => !day.isFree)).toHaveLength(2);
    expect(result.days.map((day) => day.holidayName)).toEqual([
      null,
      null,
      'Goede Vrijdag',
      null,
      'Eerste Paasdag',
      'Tweede Paasdag',
    ]);
  });

  it('bridges a holiday block with a single vacation day', () => {
    const result = calculateBestRange(new Date(2025, 3, 18), 1, workdays, new Date(2025, 4, 6));

    expect(iso(result.start)).toBe('2025-04-18');
    expect(iso(result.end)).toBe('2025-04-22');
    expect(result.totalDays).toBe(5);
    expect(result.cost).toBe(1);
  });

  it('keeps the longest free run when there are no vacation days to spend', () => {
    const result = calculateBestRange(new Date(2025, 4, 1), 0, workdays, new Date(2025, 4, 20));

    expect(iso(result.start)).toBe('2025-05-03');
    expect(iso(result.end)).toBe('2025-05-05');
    expect(result.totalDays).toBe(3);
    expect(result.cost).toBe(0);
    expect(result.days.every((day) => day.isFree)).toBe(true);
  });

  it('treats every day as free when no work days are configured', () => {
    const result = calculateBestRange(new Date(2025, 4, 1), 0, [], new Date(2025, 4, 10));

    expect(result.totalDays).toBe(10);
    expect(result.cost).toBe(0);
    expect(result.days.every((day) => day.isFree)).toBe(true);
  });

  it('returns null when every day is a work day and no vacation days may be used', () => {
    const result = calculateBestRange(
      new Date(2025, 7, 1),
      0,
      [0, 1, 2, 3, 4, 5, 6],
      new Date(2025, 7, 3)
    );

    expect(result).toBeNull();
  });

  it('defaults the search window to the end of next year', () => {
    const result = calculateBestRange(new Date(2025, 11, 1), 1);

    expect(result).not.toBeNull();
    expect(result.cost).toBeLessThanOrEqual(1);
    expect(result.end.getFullYear()).toBeGreaterThanOrEqual(2025);
  });
});

describe('findCheapestRange', () => {
  it('returns the requested number of days for the lowest vacation cost', () => {
    const result = findCheapestRange(new Date(2025, 3, 18), 9, workdays, new Date(2025, 4, 6));

    expect(iso(result.start)).toBe('2025-04-18');
    expect(iso(result.end)).toBe('2025-04-26');
    expect(result.totalDays).toBe(9);
    expect(result.cost).toBe(4);
  });

  it('finds a free range when one exists', () => {
    const result = findCheapestRange(new Date(2025, 0, 1), 4, workdays, new Date(2025, 11, 31));

    expect(iso(result.start)).toBe('2025-04-18');
    expect(iso(result.end)).toBe('2025-04-21');
    expect(result.cost).toBe(0);
  });

  it('walks the default window when no end date is given', () => {
    const result = findCheapestRange(new Date(2025, 5, 1), 30);

    expect(result.totalDays).toBe(30);
    expect(result.days).toHaveLength(30);
    expect(iso(result.start)).toBe('2025-12-06');
    expect(iso(result.end)).toBe('2026-01-04');
    expect(result.cost).toBe(17);
  });

  it('returns null when the window is shorter than the requested range', () => {
    expect(findCheapestRange(new Date(2025, 4, 1), 10, workdays, new Date(2025, 4, 3))).toBeNull();
  });
});

describe('findBestRatioRanges', () => {
  const ranges = findBestRatioRanges(new Date(2025, 3, 1), 3, 5, workdays, new Date(2025, 5, 30));

  it('ranks the free holiday blocks first', () => {
    expect(ranges).toHaveLength(10);
    expect(ranges[0].ratio).toBe(Infinity);
    expect(iso(ranges[0].start)).toBe('2025-04-18');
    expect(iso(ranges[0].end)).toBe('2025-04-21');
    expect(ranges[0].holidays).toEqual(['Goede Vrijdag', 'Eerste Paasdag', 'Tweede Paasdag']);
  });

  it('keeps the list sorted by factor and by length', () => {
    for (let i = 1; i < ranges.length; i++) {
      const previous = ranges[i - 1];
      const current = ranges[i];
      if (previous.ratio === Infinity && current.ratio === Infinity) {
        expect(previous.totalDays).toBeGreaterThanOrEqual(current.totalDays);
      } else {
        expect(previous.ratio).toBeGreaterThanOrEqual(current.ratio);
      }
    }
  });

  it('never returns overlapping periods', () => {
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const overlaps = ranges[i].start <= ranges[j].end && ranges[i].end >= ranges[j].start;
        expect(overlaps).toBe(false);
      }
    }
  });

  it('respects the minimum length and the maximum cost', () => {
    expect(ranges.every((range) => range.totalDays >= 3)).toBe(true);
    expect(ranges.every((range) => range.cost <= 5)).toBe(true);
  });

  it('returns nothing when the minimum length exceeds the window', () => {
    expect(
      findBestRatioRanges(new Date(2025, 4, 1), 40, 5, workdays, new Date(2025, 4, 10))
    ).toEqual([]);
  });
});
