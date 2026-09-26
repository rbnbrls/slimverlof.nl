import { describe, expect, it } from 'vitest';
import SchoolHolidays from '../../src/components/SchoolHolidays.jsx';
import { findAll, find, render } from '../helpers/dom.js';

describe('SchoolHolidays', () => {
  it('renders the advisory school holiday table', () => {
    const { container } = render(<SchoolHolidays />);

    expect(find(container, '.result-title').textContent).toBe('Schoolvakanties 2025-2026');
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
    expect(rows[4].querySelectorAll('td')[1].textContent).toBe('4 jul t/m 16 aug 2026');
  });

  it('shows the disclaimer about the school guide', () => {
    const { container } = render(<SchoolHolidays />);

    const note = find(container, '.holiday-note').textContent;
    expect(note).toContain('Scholen mogen afwijken');
    expect(note).toContain('Controleer');
  });

  it('renders the animated wrapper around the table', () => {
    const { container } = render(<SchoolHolidays />);

    const wrapper = find(container, '.holidays-container');
    expect(wrapper.tagName).toBe('DIV');
    expect(findAll(container, '.holidays-table-wrapper')).toHaveLength(1);
  });
});
