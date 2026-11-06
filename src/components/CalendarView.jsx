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
} from 'date-fns';
import { nl } from 'date-fns/locale';

function CalendarView({ result }) {
  if (!result) return null;

  const { start, end, days } = result;

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
    if (!dayInfo) return { status: 'none', holidayName: null };
    if (dayInfo.holidayName) return { status: 'holiday', holidayName: dayInfo.holidayName };
    return { status: dayInfo.isFree ? 'free' : 'book', holidayName: null };
  };

  return (
    <div className="calendar-container">
      {months.map((monthStart) => (
        <MonthGrid
          key={monthStart.toString()}
          monthStart={monthStart}
          getDayStatus={getDayStatus}
        />
      ))}
    </div>
  );
}

function MonthGrid({ monthStart, getDayStatus }) {
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

              const { status, holidayName } = getDayStatus(date);
              let className = 'calendar-day';
              if (status === 'free') className += ' status-free';
              if (status === 'holiday') className += ' status-holiday';
              if (status === 'book') className += ' status-book';

              return (
                <div
                  key={date.toString()}
                  className={className}
                  role="gridcell"
                  aria-label={`${format(date, 'd MMMM yyyy', { locale: nl })}, ${holidayName ? `${statusLabels[status]}: ${holidayName}` : statusLabels[status]}`}
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
