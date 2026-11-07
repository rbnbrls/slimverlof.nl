import { addYears, differenceInCalendarDays, startOfYear } from 'date-fns';

export function getYearEndCountdown(date) {
  const currentDate = new Date(date);
  const isLastTwoMonths = currentDate.getMonth() >= 10;

  if (!isLastTwoMonths) return null;

  const nextJanuary = addYears(startOfYear(currentDate), 1);

  return {
    days: differenceInCalendarDays(nextJanuary, currentDate),
    year: nextJanuary.getFullYear(),
  };
}
