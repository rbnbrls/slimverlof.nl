import { describe, expect, it } from 'vitest';
import { endOfYear, isSameDay } from 'date-fns';
import {
  buildSummaryText,
  formatShortDate,
  getHeadlineMode,
  getHolidayOffset,
  rebuildDayInfos,
} from '../../src/utils/vacationSummary.js';

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

describe('buildSummaryText', () => {
  it('renders nothing without a range', () => {
    expect(buildSummaryText(null)).toBe('');
  });

  it('counts the days, the vacation days used and the free holidays', () => {
    const text = buildSummaryText({
      totalDays: 12,
      cost: 3,
      days: [{ date: new Date(2025, 4, 5) }, { date: new Date(2025, 4, 6) }],
    });

    // 5 May 2025 is Bevrijdingsdag, 6 May is an ordinary Tuesday.
    expect(text).toBe('12 dagen vrij voor 3 verlofdagen (1 feestdagen)');
  });

  it('omits the holiday part when no public holiday is inside the range', () => {
    const text = buildSummaryText({
      totalDays: 4,
      cost: 1,
      days: [{ date: new Date(2025, 4, 6) }, { date: new Date(2025, 4, 7) }],
    });

    expect(text).toBe('4 dagen vrij voor 1 verlofdagen');
  });
});

describe('formatShortDate', () => {
  it('formats a date as "<day> <month> <year>"', () => {
    expect(formatShortDate(new Date(2027, 0, 1))).toBe('1 jan 2027');
    expect(formatShortDate(new Date(2026, 11, 25))).toBe('25 dec 2026');
  });

  it('accepts anything the Date constructor understands', () => {
    expect(formatShortDate('2026-12-25')).toBe('25 dec 2026');
  });
});

describe('rebuildDayInfos', () => {
  it('marks weekends, work days and holidays for the requested interval', () => {
    const days = rebuildDayInfos(new Date(2025, 3, 18), new Date(2025, 3, 21));

    expect(days).toHaveLength(4);
    expect(days.map((day) => iso(day.date))).toEqual([
      '2025-04-18',
      '2025-04-19',
      '2025-04-20',
      '2025-04-21',
    ]);
    expect(days[0]).toMatchObject({ holidayName: 'Goede Vrijdag', isFree: true, isWorkDay: true });
    expect(days[1]).toMatchObject({ holidayName: null, isFree: true, isWorkDay: false });
    expect(days[3]).toMatchObject({ holidayName: 'Tweede Paasdag', isFree: true, isWorkDay: true });
  });

  it('treats every day as free when no work days are configured', () => {
    const days = rebuildDayInfos(new Date(2025, 4, 6), new Date(2025, 4, 8), []);

    expect(days.every((day) => day.isFree)).toBe(true);
  });

  it('defaults the end of the interval to the end of next year', () => {
    const days = rebuildDayInfos(new Date(2025, 11, 1));
    const expectedEnd = endOfYear(new Date(new Date().getFullYear() + 1, 0, 1));

    expect(days.length).toBeGreaterThan(365);
    expect(iso(days[0].date)).toBe('2025-12-01');
    expect(isSameDay(days[days.length - 1].date, expectedEnd)).toBe(true);
  });
});

describe('getHeadlineMode', () => {
  it('maps every calculator mode to its colour', () => {
    expect(getHeadlineMode('max_free')).toBe('primary');
    expect(getHeadlineMode('find_range')).toBe('secondary');
    expect(getHeadlineMode('best_ratio')).toBe('success');
    expect(getHeadlineMode('school_holidays')).toBe('warning');
    expect(getHeadlineMode(undefined)).toBe('warning');
  });
});

describe('getHolidayOffset', () => {
  it('adds the extra 2027 public holiday and nothing otherwise', () => {
    expect(getHolidayOffset(2027)).toBe(1);
    expect(getHolidayOffset(2026)).toBe(0);
    expect(getHolidayOffset(2028)).toBe(0);
  });
});
