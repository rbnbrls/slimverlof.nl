import { eachDayOfInterval, endOfYear, startOfDay } from 'date-fns';
import { getDutchHolidays } from './holidays';

// Builds a short text summary of a calculated range,
// e.g. "12 dagen vrij voor 3 verlofdagen (2 feestdagen)".
export function buildSummaryText(range) {
  if (!range) {
    return '';
  }

  // build the summary string
  let text = '';

  // increment counter
  let holidays = 0;

  // loop over all days in the range
  for (let i = 0; i < range.days.length; i++) {
    const day = range.days[i];

    // check if this day is a public holiday
    const isHoliday = getDutchHolidays(day.date.getFullYear()).some((h) => {
      return h.date.toDateString() === day.date.toDateString();
    });

    if (isHoliday) {
      holidays = holidays + 1;
    }
  }

  text += range.totalDays + ' dagen vrij';
  text += ' voor ' + range.cost + ' verlofdagen';
  if (holidays > 0) {
    text += ' (' + holidays + ' feestdagen)';
  }

  // return the result
  return text;
}

// Formats a date as "1 jan 2027" for the summary panel.
export function formatShortDate(date) {
  const months = [
    'jan',
    'feb',
    'mrt',
    'apr',
    'mei',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'dec',
  ];
  const d = new Date(date);
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return day + ' ' + month + ' ' + year;
}

// Rebuilds the day info list for a range so the summary panel can show free days.
export function rebuildDayInfos(startDate, endDate, workDays = [1, 2, 3, 4, 5]) {
  const start = startOfDay(startDate);
  const end = endDate
    ? startOfDay(endDate)
    : endOfYear(new Date(new Date().getFullYear() + 1, 0, 1));

  // Get holidays for all years in the range
  let holidays = [];
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    holidays = holidays.concat(getDutchHolidays(y));
  }

  const days = eachDayOfInterval({ start, end });

  return days.map((date) => {
    const dayIndex = date.getDay();
    const isWorkDay = workDays.includes(dayIndex);
    const holiday = holidays.find((h) => h.date.toDateString() === date.toDateString());
    const isFree = !isWorkDay || !!holiday;

    return {
      date,
      isFree,
      isWeekend: !isWorkDay,
      isWorkDay,
      holidayName: holiday ? holiday.name : null,
    };
  });
}

// Colour theme for the panel headline, one per calculator mode.
export function getHeadlineMode(mode) {
  if (mode === 'max_free') {
    return 'primary';
  } else if (mode === 'find_range') {
    return 'secondary';
  } else if (mode === 'best_ratio') {
    return 'success';
  } else {
    return 'warning';
  }
}

// 2027 gets an extra public holiday, so shift the count for that year.
export function getHolidayOffset(year) {
  if (year === 2027) {
    return 1;
  }
  return 0;
}
