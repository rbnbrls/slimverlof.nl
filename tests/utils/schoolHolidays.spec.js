import { describe, expect, it } from 'vitest';
import { SCHOOL_HOLIDAY_YEARS } from '../../src/data/schoolHolidays.js';
import {
  formatSchoolHolidayRange,
  getAvailableSchoolYears,
  getSchoolYearId,
  getSchoolYearsForDate,
} from '../../src/utils/schoolHolidays.js';

describe('school holiday data', () => {
  it('changes school year on August 1', () => {
    expect(getSchoolYearId(new Date(2026, 6, 31))).toBe('2025-2026');
    expect(getSchoolYearId(new Date(2026, 7, 1))).toBe('2026-2027');
  });

  it('returns current and next available school years', () => {
    const { current, next, available } = getSchoolYearsForDate(new Date(2026, 10, 6));
    expect(current.id).toBe('2026-2027');
    expect(next.id).toBe('2027-2028');
    expect(available.map(({ id }) => id)).toEqual(['2026-2027', '2027-2028']);
    expect(getAvailableSchoolYears(new Date(2026, 6, 31)).map(({ id }) => id)).toEqual([
      '2025-2026',
      '2026-2027',
    ]);
  });

  it('keeps every region as structured ISO date ranges', () => {
    for (const schoolYear of SCHOOL_HOLIDAY_YEARS) {
      expect(schoolYear.holidays).toHaveLength(5);
      for (const holiday of schoolYear.holidays) {
        for (const region of ['north', 'middle', 'south']) {
          expect(holiday.regions[region].start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(holiday.regions[region].end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }
    }
  });

  it('matches the official 2026-2027 and 2027-2028 dates', () => {
    const twentySix = SCHOOL_HOLIDAY_YEARS.find(({ id }) => id === '2026-2027');
    const twentySeven = SCHOOL_HOLIDAY_YEARS.find(({ id }) => id === '2027-2028');
    expect(twentySix.holidays[0].regions).toEqual({
      north: { start: '2026-10-10', end: '2026-10-18' },
      middle: { start: '2026-10-17', end: '2026-10-25' },
      south: { start: '2026-10-17', end: '2026-10-25' },
    });
    expect(twentySix.holidays[4].regions.south).toEqual({ start: '2027-07-24', end: '2027-09-05' });
    expect(twentySeven.holidays[2].regions.north).toEqual({
      start: '2028-02-19',
      end: '2028-02-27',
    });
    expect(twentySeven.holidays[4].regions.middle).toEqual({
      start: '2028-07-08',
      end: '2028-08-20',
    });
  });

  it('formats date-only values without timezone shifts', () => {
    expect(formatSchoolHolidayRange({ start: '2027-04-24', end: '2027-05-02' })).toBe(
      '24 apr 2027 t/m 2 mei 2027'
    );
  });
});
