import {
    eachDayOfInterval,
    endOfYear,
    isWeekend,
    isSameDay,
    differenceInCalendarDays,
    addDays,
    startOfDay
} from 'date-fns';
import { getDutchHolidays } from './holidays';

/**
 * Calculates the best vacation scenario.
 * @param {Date} startDate - The date to start looking from.
 * @param {number} vacationDays - Number of available vacation days.
 * @param {number[]} workDays - Array of day indices (0=Sunday, 1=Monday, etc.) that are work days. Default [1,2,3,4,5].
 * @returns {object} - The best range found.
 */
export function calculateBestRange(startDate, vacationDays, workDays = [1, 2, 3, 4, 5]) {
    const start = startOfDay(startDate);
    const year = start.getFullYear();
    const nextYear = year + 1;
    // Extend search period to end of next year to allow year-boundary crossing
    const end = endOfYear(new Date(nextYear, 0, 1));

    // Get holidays for both current year and next year
    const holidaysThisYear = getDutchHolidays(year);
    const holidaysNextYear = getDutchHolidays(nextYear);
    const holidays = [...holidaysThisYear, ...holidaysNextYear];

    // Generate all days from start to end of next year
    const days = eachDayOfInterval({ start, end });

    // Map days to info
    const dayInfos = days.map(date => {
        const dayIndex = date.getDay();
        const isWorkDay = workDays.includes(dayIndex);
        const holiday = holidays.find(h => isSameDay(h.date, date));

        // A day is free if it's NOT a work day OR it is a holiday
        const isFree = !isWorkDay || !!holiday;

        return {
            date,
            isFree,
            isWeekend: !isWorkDay, // Reusing isWeekend to mean "standard off day" for simplicity in UI, or we can distinguish
            isWorkDay,
            holidayName: holiday ? holiday.name : null
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
                days: dayInfos.slice(left, right + 1)
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
export function findCheapestRange(startDate, targetLength, workDays = [1, 2, 3, 4, 5]) {
    const start = startOfDay(startDate);
    const year = start.getFullYear();
    const nextYear = year + 1;
    // Extend search period to end of next year to allow year-boundary crossing
    const end = endOfYear(new Date(nextYear, 0, 1));

    // Get holidays for both current year and next year
    const holidaysThisYear = getDutchHolidays(year);
    const holidaysNextYear = getDutchHolidays(nextYear);
    const holidays = [...holidaysThisYear, ...holidaysNextYear];
    const days = eachDayOfInterval({ start, end });

    const dayInfos = days.map(date => {
        const dayIndex = date.getDay();
        const isWorkDay = workDays.includes(dayIndex);
        const holiday = holidays.find(h => isSameDay(h.date, date));
        const isFree = !isWorkDay || !!holiday;

        return {
            date,
            isFree,
            isWeekend: !isWorkDay,
            isWorkDay,
            holidayName: holiday ? holiday.name : null
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
                days: window
            };
        }
    }

    return bestRange;
}
