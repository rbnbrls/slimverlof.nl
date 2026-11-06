import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { SCHOOL_HOLIDAY_YEARS } from '../data/schoolHolidays';

export function getSchoolYearId(date) {
  const year = date.getFullYear();
  const startYear = date >= new Date(year, 7, 1) ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
}

export function getAvailableSchoolYears(date, schoolYears = SCHOOL_HOLIDAY_YEARS) {
  const currentId = getSchoolYearId(date);
  const currentIndex = schoolYears.findIndex(({ id }) => id === currentId);
  const firstIndex = currentIndex === -1 ? 0 : currentIndex;
  return schoolYears.slice(firstIndex, firstIndex + 2);
}

export function getSchoolYearsForDate(date, schoolYears = SCHOOL_HOLIDAY_YEARS) {
  const available = getAvailableSchoolYears(date, schoolYears);
  return { current: available[0], next: available[1], available };
}

export function formatSchoolHolidayRange(range) {
  const formatDate = (value) =>
    format(parseISO(value), 'd MMM yyyy', { locale: nl }).replaceAll('.', '');
  return `${formatDate(range.start)} t/m ${formatDate(range.end)}`;
}
