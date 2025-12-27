import { addDays, isSunday, setDate, setMonth, setYear, startOfDay } from 'date-fns';

/**
 * Calculates the date of Easter Sunday for a given year using the anonymous algorithm (Meeus/Jones/Butcher).
 * @param {number} year
 * @returns {Date}
 */
function getEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 1-indexed (3 = March, 4 = April)
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/**
 * Returns an array of Dutch national holidays for a given year.
 * @param {number} year
 * @returns {Array<{date: Date, name: string}>}
 */
export function getDutchHolidays(year) {
  const holidays = [];

  // Fixed date holidays
  holidays.push({ date: new Date(year, 0, 1), name: "Nieuwjaarsdag" }); // Jan 1
  holidays.push({ date: new Date(year, 4, 5), name: "Bevrijdingsdag" }); // May 5
  holidays.push({ date: new Date(year, 11, 25), name: "Eerste Kerstdag" }); // Dec 25
  holidays.push({ date: new Date(year, 11, 26), name: "Tweede Kerstdag" }); // Dec 26

  // King's Day (Koningsdag) - April 27, but if Sunday, moves to Saturday 26
  let kingsDay = new Date(year, 3, 27);
  if (isSunday(kingsDay)) {
    kingsDay = new Date(year, 3, 26);
  }
  holidays.push({ date: kingsDay, name: "Koningsdag" });

  // Variable holidays based on Easter
  const easterSunday = getEaster(year);
  const easterMonday = addDays(easterSunday, 1);
  const goodFriday = addDays(easterSunday, -2);
  const ascensionDay = addDays(easterSunday, 39);
  const whitSunday = addDays(easterSunday, 49); // Pinksteren 1
  const whitMonday = addDays(easterSunday, 50); // Pinksteren 2

  holidays.push({ date: goodFriday, name: "Goede Vrijdag" });
  holidays.push({ date: easterSunday, name: "Eerste Paasdag" });
  holidays.push({ date: easterMonday, name: "Tweede Paasdag" });
  holidays.push({ date: ascensionDay, name: "Hemelvaartsdag" });
  holidays.push({ date: whitSunday, name: "Eerste Pinksterdag" });
  holidays.push({ date: whitMonday, name: "Tweede Pinksterdag" });

  // Sort by date
  return holidays.sort((a, b) => a.date - b.date);
}
