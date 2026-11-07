import { describe, expect, it } from 'vitest';
import CalendarView from '../../src/components/CalendarView.jsx';
import { click, findAll, find, render } from '../helpers/dom.js';

// Range that spans two months: 30 April and 1-3 May are vacation days, 5 May is
// Bevrijdingsdag and the weekend in between is free already.
const day = (date, { isFree, holidayName = null }) => ({
  date,
  isFree,
  isWeekend: date.getDay() === 0 || date.getDay() === 6,
  isWorkDay: date.getDay() !== 0 && date.getDay() !== 6,
  holidayName,
});

const result = {
  start: new Date(2025, 3, 30),
  end: new Date(2025, 4, 5),
  totalDays: 6,
  cost: 4,
  days: [
    day(new Date(2025, 3, 30), { isFree: false }),
    day(new Date(2025, 4, 1), { isFree: false }),
    day(new Date(2025, 4, 2), { isFree: false }),
    day(new Date(2025, 4, 3), { isFree: true }),
    day(new Date(2025, 4, 4), { isFree: true }),
    day(new Date(2025, 4, 5), { isFree: true, holidayName: 'Bevrijdingsdag' }),
  ],
};

describe('CalendarView', () => {
  it('renders nothing without a result', () => {
    const { container } = render(<CalendarView result={null} />);

    expect(container.innerHTML).toBe('');
  });

  it('renders one grid per month covered by the range', () => {
    const { container } = render(<CalendarView result={result} />);

    const titles = findAll(container, '.month-title').map((title) => title.textContent);
    expect(titles).toEqual(['april 2025', 'mei 2025']);
  });

  it('paints the booked, free and holiday days differently', () => {
    const { container } = render(<CalendarView result={result} />);

    const booked = findAll(container, '.calendar-day.status-book').map((day) => day.textContent);
    const holidays = findAll(container, '.calendar-day.status-holiday').map(
      (day) => day.textContent
    );
    const free = findAll(container, '.calendar-day.status-free').map((day) => day.textContent);

    expect(booked).toEqual(['30', '1', '2']);
    expect(holidays).toEqual(['5']);
    expect(free).toEqual(['3', '4']);
  });

  it('exposes calendar semantics and textual day statuses', () => {
    const { container } = render(<CalendarView result={result} />);

    expect(findAll(container, '[role="grid"]')).toHaveLength(2);
    expect(find(container, '.status-holiday').getAttribute('aria-label')).toContain(
      '5 mei 2025, feestdag: Bevrijdingsdag'
    );
    expect(find(container, '.status-book').getAttribute('aria-label')).toContain(
      '30 april 2025, verlof opnemen'
    );
    expect(
      findAll(container, '.calendar-day.empty').every(
        (cell) => cell.getAttribute('aria-hidden') === 'true'
      )
    ).toBe(true);
  });

  it('fills the leading and trailing cells of the week grid', () => {
    const { container } = render(<CalendarView result={result} />);

    expect(findAll(container, '.calendar-day.empty').length).toBeGreaterThan(0);
    expect(find(container, '.days-header').textContent).toBe('MaDiWoDoVrZaZo');
  });

  it('leaves days outside the selected range unmarked', () => {
    const { container } = render(<CalendarView result={result} />);

    const untouched = findAll(container, '.calendar-day').filter(
      (cell) => cell.className === 'calendar-day' && cell.textContent !== ''
    );
    expect(untouched.length).toBeGreaterThan(0);
  });

  it('shows school holidays with a region choice and can hide them', () => {
    const schoolHolidayResult = {
      ...result,
      start: new Date(2026, 3, 25),
      end: new Date(2026, 4, 3),
      days: [],
    };
    const { container } = render(<CalendarView result={schoolHolidayResult} />);

    expect(findAll(container, '.status-school-holiday').length).toBeGreaterThan(0);
    expect(find(container, '.status-school-holiday').getAttribute('aria-label')).toContain(
      'schoolvakantie Meivakantie, regio Midden'
    );

    expect(find(container, '#calendar-school-region').value).toBe('middle');

    click(find(container, '.calendar-toggle input'));
    expect(findAll(container, '.status-school-holiday')).toHaveLength(0);
  });
});
