import { describe, expect, it } from 'vitest';
import { getDutchHolidays } from '../../src/utils/holidays.js';

const iso = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const findHoliday = (year, name) => getDutchHolidays(year).find((holiday) => holiday.name === name);

describe('getDutchHolidays', () => {
  it('returns every national holiday of a year in chronological order', () => {
    const holidays = getDutchHolidays(2025);
    expect(holidays).toHaveLength(11);
    const timestamps = holidays.map((holiday) => holiday.date.getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });

  it('lists the fixed-date holidays', () => {
    expect(iso(findHoliday(2025, 'Nieuwjaarsdag').date)).toBe('2025-01-01');
    expect(iso(findHoliday(2025, 'Bevrijdingsdag').date)).toBe('2025-05-05');
    expect(iso(findHoliday(2025, 'Eerste Kerstdag').date)).toBe('2025-12-25');
    expect(iso(findHoliday(2025, 'Tweede Kerstdag').date)).toBe('2025-12-26');
  });

  it('moves Koningsdag to the Saturday when 27 April is a Sunday', () => {
    // 27 April 2025 is a Sunday, 27 April 2026 is a Monday.
    expect(iso(findHoliday(2025, 'Koningsdag').date)).toBe('2025-04-26');
    expect(iso(findHoliday(2026, 'Koningsdag').date)).toBe('2026-04-27');
  });

  it('derives the Easter-based holidays plus Ascension and Whitsun from Easter Sunday', () => {
    expect(iso(findHoliday(2025, 'Goede Vrijdag').date)).toBe('2025-04-18');
    expect(iso(findHoliday(2025, 'Eerste Paasdag').date)).toBe('2025-04-20');
    expect(iso(findHoliday(2025, 'Tweede Paasdag').date)).toBe('2025-04-21');
    expect(iso(findHoliday(2025, 'Hemelvaartsdag').date)).toBe('2025-05-29');
    expect(iso(findHoliday(2025, 'Eerste Pinksterdag').date)).toBe('2025-06-08');
    expect(iso(findHoliday(2025, 'Tweede Pinksterdag').date)).toBe('2025-06-09');
  });

  it('computes Easter for leap and non-leap years', () => {
    expect(iso(findHoliday(2024, 'Eerste Paasdag').date)).toBe('2024-03-31');
    expect(iso(findHoliday(2026, 'Eerste Paasdag').date)).toBe('2026-04-05');
    expect(iso(findHoliday(2026, 'Hemelvaartsdag').date)).toBe('2026-05-14');
  });
});
