import { useState } from 'react';
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
  addMonths,
  parseISO,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { SCHOOL_HOLIDAY_YEARS } from '../data/schoolHolidays';

const SCHOOL_REGIONS = [
  { id: 'north', label: 'Noord' },
  { id: 'middle', label: 'Midden' },
  { id: 'south', label: 'Zuid' },
];

function CalendarView({ result }) {
  const [showSchoolHolidays, setShowSchoolHolidays] = useState(true);
  const [schoolRegion, setSchoolRegion] = useState('middle');

  if (!result) return null;

  const { start, end, days } = result;
  const schoolHolidayDays = new Map();
  if (showSchoolHolidays) {
    SCHOOL_HOLIDAY_YEARS.forEach((schoolYear) => {
      schoolYear.holidays.forEach((holiday) => {
        const range = holiday.regions[schoolRegion];
        eachDayOfInterval({ start: parseISO(range.start), end: parseISO(range.end) }).forEach(
          (date) => schoolHolidayDays.set(format(date, 'yyyy-MM-dd'), holiday.name)
        );
      });
    });
  }

  // Determine months to show
  const startMonth = startOfMonth(start);
  const endMonth = startOfMonth(end);
  const months = [];
  let current = startMonth;

  while (current <= endMonth) {
    months.push(current);
    current = addMonths(current, 1);
  }

  // Helper to get status of a day
  const getDayStatus = (date) => {
    const dayInfo = days.find((d) => isSameDay(d.date, date));
    const schoolHolidayName = schoolHolidayDays.get(format(date, 'yyyy-MM-dd')) || null;
    if (!dayInfo) return { status: 'none', holidayName: null, schoolHolidayName };
    if (dayInfo.holidayName) {
      return { status: 'holiday', holidayName: dayInfo.holidayName, schoolHolidayName };
    }
    return { status: dayInfo.isFree ? 'free' : 'book', holidayName: null, schoolHolidayName };
  };

  return (
    <>
      <div className="calendar-options" aria-label="Kalenderopties">
        <label className="calendar-toggle">
          <input
            type="checkbox"
            checked={showSchoolHolidays}
            onChange={(event) => setShowSchoolHolidays(event.target.checked)}
          />
          <span>Schoolvakanties tonen</span>
        </label>
        {showSchoolHolidays && (
          <label className="calendar-region" htmlFor="calendar-school-region">
            <span>Regio</span>
            <select
              id="calendar-school-region"
              value={schoolRegion}
              onChange={(event) => setSchoolRegion(event.target.value)}
            >
              {SCHOOL_REGIONS.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="calendar-container">
        {months.map((monthStart) => (
          <MonthGrid
            key={monthStart.toString()}
            monthStart={monthStart}
            getDayStatus={getDayStatus}
            schoolRegion={schoolRegion}
          />
        ))}
      </div>
    </>
  );
}

function MonthGrid({ monthStart, getDayStatus, schoolRegion }) {
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });
  const weekDays = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

  const monthLabel = format(monthStart, 'MMMM yyyy', { locale: nl });
  const weeks = [];
  for (let index = 0; index < calendarDays.length; index += 7) {
    weeks.push(calendarDays.slice(index, index + 7));
  }

  const statusLabels = {
    free: 'vrije dag',
    holiday: 'feestdag',
    book: 'verlof opnemen',
    none: 'geen geselecteerde periode',
  };
  const regionLabel = SCHOOL_REGIONS.find((region) => region.id === schoolRegion)?.label;

  return (
    <section className="month-card" aria-labelledby={`month-${monthStart.getTime()}`}>
      <h3 id={`month-${monthStart.getTime()}`} className="month-title">
        {monthLabel}
      </h3>

      <div className="days-header">
        {weekDays.map((d) => (
          <div key={d} className="day-label">
            {d}
          </div>
        ))}
      </div>

      <div className="days-grid" role="grid" aria-label={`Kalender ${monthLabel}`}>
        {weeks.map((week, weekIndex) => (
          <div className="calendar-week-row" role="row" key={`${monthLabel}-${weekIndex}`}>
            {week.map((date) => {
              const isCurrentMonth = isSameMonth(date, monthStart);

              if (!isCurrentMonth) {
                return (
                  <div
                    key={date.toString()}
                    className="calendar-day empty"
                    role="gridcell"
                    aria-hidden="true"
                  />
                );
              }

              const { status, holidayName, schoolHolidayName } = getDayStatus(date);
              let className = 'calendar-day';
              if (status === 'free') className += ' status-free';
              if (status === 'holiday') className += ' status-holiday';
              if (status === 'book') className += ' status-book';
              if (schoolHolidayName) className += ' status-school-holiday';

              const labels = [
                `${format(date, 'd MMMM yyyy', { locale: nl })}, ${holidayName ? `${statusLabels[status]}: ${holidayName}` : statusLabels[status]}`,
              ];
              if (schoolHolidayName) {
                labels.push(`schoolvakantie ${schoolHolidayName}, regio ${regionLabel}`);
              }

              return (
                <div
                  key={date.toString()}
                  className={className}
                  role="gridcell"
                  aria-label={labels.join(', ')}
                  title={labels.join(', ')}
                >
                  {format(date, 'd')}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

export default CalendarView;
