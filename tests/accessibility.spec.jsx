import { describe, expect, it } from 'vitest';
import axe from 'axe-core';
import App from '../src/App.jsx';
import CalendarView from '../src/components/CalendarView.jsx';
import SchoolHolidays from '../src/components/SchoolHolidays.jsx';
import ShareButton from '../src/components/ShareButton.jsx';
import { click, find, render } from './helpers/dom.js';

const result = {
  start: new Date(2027, 3, 27),
  end: new Date(2027, 4, 5),
  totalDays: 9,
  cost: 4,
  days: [
    { date: new Date(2027, 3, 27), isFree: true, holidayName: 'Koningsdag' },
    { date: new Date(2027, 4, 5), isFree: true, holidayName: 'Bevrijdingsdag' },
  ],
};

async function expectAccessible(container) {
  const report = await axe.run(container, { reporter: 'v1' });
  expect(report.violations, JSON.stringify(report.violations, null, 2)).toEqual([]);
}

describe('accessibility', () => {
  it('keeps the main calculator accessible', async () => {
    const { container } = render(<App />);
    await expectAccessible(container);
  });

  it('keeps the calendar grid accessible', async () => {
    const { container } = render(<CalendarView result={result} />);
    await expectAccessible(container);
  });

  it('keeps the open share menu accessible', async () => {
    const { container } = render(<ShareButton />);
    click(find(container, '.share-btn'));
    await expectAccessible(container);
  });

  it('keeps the school-holiday overview accessible', async () => {
    const { container } = render(<SchoolHolidays today={new Date(2026, 10, 6)} />);
    await expectAccessible(container);
  });
});
