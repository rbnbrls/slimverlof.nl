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
    if (!dayInfo) return 'none';
    if (dayInfo.holidayName) return 'holiday';
    return dayInfo.isFree ? 'free' : 'book';
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

  return (
    <div className="month-card">
      <h3 className="month-title">{format(monthStart, 'MMMM yyyy', { locale: nl })}</h3>

      <div className="days-header">
        {weekDays.map((d) => (
          <div key={d} className="day-label">
            {d}
          </div>
        ))}
      </div>

      <div className="days-grid">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, monthStart);

          if (!isCurrentMonth) {
            return <div key={date.toString()} className="calendar-day empty"></div>;
          }

          const status = getDayStatus(date);
          let className = 'calendar-day';
          if (status === 'free') className += ' status-free';
          if (status === 'holiday') className += ' status-holiday';
          if (status === 'book') className += ' status-book';

          return (
            <div key={date.toString()} className={className}>
              {format(date, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;
