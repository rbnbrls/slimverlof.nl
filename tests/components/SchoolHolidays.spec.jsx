import { act } from 'react';
import { describe, expect, it } from 'vitest';
import SchoolHolidays from '../../src/components/SchoolHolidays.jsx';
import { findAll, find, render } from '../helpers/dom.js';

const renderCurrentYear = () => render(<SchoolHolidays today={new Date(2026, 10, 6)} />);

describe('SchoolHolidays', () => {
  it('renders the date-derived current school holiday table', () => {
    const { container } = renderCurrentYear();
    expect(find(container, '.result-title').textContent).toBe('Schoolvakanties 2026-2027');
    expect(findAll(container, 'thead th').map((cell) => cell.textContent)).toEqual([
      'Vakantie',
      'Regio Noord',
      'Regio Midden',
      'Regio Zuid',
    ]);
    const rows = findAll(container, 'tbody tr');
    expect(rows.map((row) => row.querySelector('.holiday-name').textContent)).toEqual([
      'Herfstvakantie',
      'Kerstvakantie',
      'Voorjaarsvakantie',
      'Meivakantie',
      'Zomervakantie',
    ]);
    expect(rows[0].querySelectorAll('td')[1].textContent).toBe('10 okt 2026 t/m 18 okt 2026');
    expect(rows[0].querySelectorAll('td')[2].textContent).toBe('17 okt 2026 t/m 25 okt 2026');
    expect(rows[0].querySelectorAll('td')[3].textContent).toBe('17 okt 2026 t/m 25 okt 2026');
    expect(rows[4].querySelectorAll('td')[3].textContent).toBe('24 jul 2027 t/m 5 sep 2027');
  });

  it('allows switching to the next school year', () => {
    const { container } = renderCurrentYear();
    const selector = find(container, '#school-holiday-year');
    act(() => {
      selector.value = '2027-2028';
      selector.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(find(container, '.result-title').textContent).toBe('Schoolvakanties 2027-2028');
    expect(find(container, '.holiday-note').textContent).toContain('22 apr 2028 t/m 30 apr 2028');
    expect(find(container, 'a').getAttribute('href')).toContain(
      'overzicht-schoolvakanties-2027-2028'
    );
  });

  it('shows the disclaimer and official source', () => {
    const { container } = renderCurrentYear();
    const note = find(container, '.holiday-note').textContent;
    expect(note).toContain('Scholen mogen afwijken');
    expect(note).toContain('Controleer');
    expect(note).toContain('adviesdata');
    expect(find(container, 'a').getAttribute('href')).toContain(
      'overzicht-schoolvakanties-2026-2027'
    );
  });

  it('renders the animated wrapper around the table', () => {
    const { container } = renderCurrentYear();
    expect(find(container, '.holidays-container').tagName).toBe('DIV');
    expect(findAll(container, '.holidays-table-wrapper')).toHaveLength(1);
  });
});
