import {
  eachDayOfInterval,
  endOfYear,
  isSameDay,
  startOfDay,
} from 'date-fns';
import { getDutchHolidays } from './holidays';

/**
 * Calculates the best vacation scenario.
 * @param {Date} startDate - The date to start looking from.
 * @param {number} vacationDays - Number of available vacation days.
 * @param {number[]} workDays - Array of day indices (0=Sunday, 1=Monday, etc.) that are work days. Default [1,2,3,4,5].
 * @param {Date} [endDate] - Optional end date for the search period. Defaults to end of next year.
 * @returns {object} - The best range found.
 */
export function calculateBestRange(
  startDate,
  vacationDays,
  workDays = [1, 2, 3, 4, 5],
  endDate = null
) {
  const start = startOfDay(startDate);
  const year = start.getFullYear();
  const nextYear = year + 1;

  // Use provided endDate or default to end of next year
  const end = endDate ? startOfDay(endDate) : endOfYear(new Date(nextYear, 0, 1));

  // Get holidays for all years in the range
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  let holidays = [];
  for (let y = startYear; y <= endYear; y++) {
    holidays = holidays.concat(getDutchHolidays(y));
  }

  // Generate all days from start to end
  const days = eachDayOfInterval({ start, end });

  // Map days to info
  const dayInfos = days.map((date) => {
    const dayIndex = date.getDay();
    const isWorkDay = workDays.includes(dayIndex);
    const holiday = holidays.find((h) => isSameDay(h.date, date));

    // A day is free if it's NOT a work day OR it is a holiday
    const isFree = !isWorkDay || !!holiday;

    return {
      date,
      isFree,
      isWeekend: !isWorkDay, // Reusing isWeekend to mean "standard off day" for simplicity in UI, or we can distinguish
      isWorkDay,
      holidayName: holiday ? holiday.name : null,
    };
  });

  let maxConnectedDays = 0;
  let bestRange = null;

  // Sliding window
  let left = 0;
  let currentCost = 0;

  for (let right = 0; right < dayInfos.length; right++) {
    if (!dayInfos[right].isFree) {
      currentCost++;
    }

    while (currentCost > vacationDays) {
      if (!dayInfos[left].isFree) {
        currentCost--;
      }
      left++;
    }

    // Current window is valid (cost <= vacationDays)
    // Calculate connected days
    // Note: The window [left, right] represents the range of DATES we are considering.
    // The number of connected free days is the duration of this window.
    // Wait, if the window starts or ends with working days that we "bought", they count as free days now.
    // So yes, the length of the window is the number of connected free days.

    const currentLength = right - left + 1;

    if (currentLength > maxConnectedDays) {
      maxConnectedDays = currentLength;
      bestRange = {
        start: dayInfos[left].date,
        end: dayInfos[right].date,
        totalDays: currentLength,
        cost: currentCost, // Might be less than vacationDays if we ran out of year
        days: dayInfos.slice(left, right + 1),
      };
    }
  }

  return bestRange;
}

/**
 * Finds the range of a specific length that costs the least amount of vacation days.
 * @param {Date} startDate - The date to start looking from.
 * @param {number} targetLength - The desired number of consecutive free days.
 * @param {number[]} workDays - Array of day indices that are work days.
 * @returns {object} - The best range found (minimum cost).
 */
/**
 * Finds the top vacation periods with the best ratio (total days / vacation days used).
 * @param {Date} startDate - The date to start looking from.
 * @param {number} minLength - Minimum number of consecutive free days desired.
 * @param {number} maxCost - Maximum vacation days willing to spend per period.
 * @param {number[]} workDays - Array of day indices that are work days.
 * @param {Date} [endDate] - Optional end date for the search period. Defaults to end of next year.
 * @returns {object[]} - Array of top 10 ranges sorted by ratio (highest first).
 */
export function findBestRatioRanges(
  startDate,
  minLength = 3,
  maxCost = 5,
  workDays = [1, 2, 3, 4, 5],
  endDate = null
) {
  const start = startOfDay(startDate);
  const year = start.getFullYear();
  const nextYear = year + 1;

  // Use provided endDate or default to end of next year
  const end = endDate ? startOfDay(endDate) : endOfYear(new Date(nextYear, 0, 1));

  // Get holidays for all years in the range
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  let holidays = [];
  for (let y = startYear; y <= endYear; y++) {
    holidays = holidays.concat(getDutchHolidays(y));
  }

  const days = eachDayOfInterval({ start, end });

  const dayInfos = days.map((date) => {
    const dayIndex = date.getDay();
    const isWorkDay = workDays.includes(dayIndex);
    const holiday = holidays.find((h) => isSameDay(h.date, date));
    const isFree = !isWorkDay || !!holiday;

    return {
      date,
      isFree,
      isWeekend: !isWorkDay,
      isWorkDay,
      holidayName: holiday ? holiday.name : null,
    };
  });

  const ranges = [];

  // Use sliding window to find all valid ranges
  let left = 0;
  let currentCost = 0;

  for (let right = 0; right < dayInfos.length; right++) {
    if (!dayInfos[right].isFree) {
      currentCost++;
    }

    // Shrink window if cost exceeds max
    while (currentCost > maxCost && left <= right) {
      if (!dayInfos[left].isFree) {
        currentCost--;
      }
      left++;
    }

    // Check if current window is valid (meets minimum length)
    const currentLength = right - left + 1;

    if (currentLength >= minLength && currentCost > 0) {
      const ratio = currentLength / currentCost;

      // Get holiday names in this range for display
      const windowDays = dayInfos.slice(left, right + 1);
      const holidaysInRange = windowDays.filter((d) => d.holidayName).map((d) => d.holidayName);

      ranges.push({
        start: dayInfos[left].date,
        end: dayInfos[right].date,
        totalDays: currentLength,
        cost: currentCost,
        ratio: Math.round(ratio * 10) / 10,
        days: windowDays,
        holidays: [...new Set(holidaysInRange)], // Unique holiday names
      });
    }
  }

  // Also find ranges where cost is 0 (all free days) - these have infinite ratio
  // but we'll score them high and cap at a reasonable display value
  for (let i = 0; i < dayInfos.length; i++) {
    if (!dayInfos[i].isFree) continue;

    let j = i;
    while (j < dayInfos.length && dayInfos[j].isFree) {
      j++;
    }

    const length = j - i;
    if (length >= minLength) {
      const windowDays = dayInfos.slice(i, j);
      const holidaysInRange = windowDays.filter((d) => d.holidayName).map((d) => d.holidayName);

      ranges.push({
        start: dayInfos[i].date,
        end: dayInfos[j - 1].date,
        totalDays: length,
        cost: 0,
        ratio: Infinity, // Free vacation!
        days: windowDays,
        holidays: [...new Set(holidaysInRange)],
      });
    }

    i = j; // Skip to end of this free block
  }

  // Sort by ratio (highest first), then by total days (longest first)
  ranges.sort((a, b) => {
    if (b.ratio === Infinity && a.ratio === Infinity) {
      return b.totalDays - a.totalDays;
    }
    if (b.ratio === Infinity) return 1;
    if (a.ratio === Infinity) return -1;
    if (b.ratio !== a.ratio) return b.ratio - a.ratio;
    return b.totalDays - a.totalDays;
  });

  // Remove overlapping ranges, keeping the best ones
  const uniqueRanges = [];
  for (const range of ranges) {
    const overlaps = uniqueRanges.some((existing) => {
      return range.start <= existing.end && range.end >= existing.start;
    });

    if (!overlaps) {
      uniqueRanges.push(range);
    }

    if (uniqueRanges.length >= 10) break;
  }

  return uniqueRanges;
}

/**
 * Finds the range of a specific length that costs the least amount of vacation days.
 * @param {Date} startDate - The date to start looking from.
 * @param {number} targetLength - The desired number of consecutive free days.
 * @param {number[]} workDays - Array of day indices that are work days.
 * @param {Date} [endDate] - Optional end date for the search period. Defaults to end of next year.
 * @returns {object} - The best range found (minimum cost).
 */
export function findCheapestRange(
  startDate,
  targetLength,
  workDays = [1, 2, 3, 4, 5],
  endDate = null
) {
  const start = startOfDay(startDate);
  const year = start.getFullYear();
  const nextYear = year + 1;

  // Use provided endDate or default to end of next year
  const end = endDate ? startOfDay(endDate) : endOfYear(new Date(nextYear, 0, 1));

  // Get holidays for all years in the range
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  let holidays = [];
  for (let y = startYear; y <= endYear; y++) {
    holidays = holidays.concat(getDutchHolidays(y));
  }

  const days = eachDayOfInterval({ start, end });

  const dayInfos = days.map((date) => {
    const dayIndex = date.getDay();
    const isWorkDay = workDays.includes(dayIndex);
    const holiday = holidays.find((h) => isSameDay(h.date, date));
    const isFree = !isWorkDay || !!holiday;

    return {
      date,
      isFree,
      isWeekend: !isWorkDay,
      isWorkDay,
      holidayName: holiday ? holiday.name : null,
    };
  });

  let minCost = Infinity;
  let bestRange = null;

  // Sliding window of fixed size
  // We need a window of length 'targetLength'
  // If the remaining days are fewer than targetLength, we stop

  for (let i = 0; i <= dayInfos.length - targetLength; i++) {
    const window = dayInfos.slice(i, i + targetLength);

    // Calculate cost for this window
    const cost = window.reduce((acc, day) => acc + (day.isFree ? 0 : 1), 0);

    if (cost < minCost) {
      minCost = cost;
      bestRange = {
        start: window[0].date,
        end: window[window.length - 1].date,
        totalDays: targetLength,
        cost: cost,
        days: window,
      };
    }
  }

  return bestRange;
}
