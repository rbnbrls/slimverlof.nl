import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import SummaryPanel from '../../src/components/SummaryPanel.jsx';
import { click, find, findAll, render, stubClipboard } from '../helpers/dom.js';

const flush = () => act(async () => {});

const range = {
  start: new Date(2025, 3, 18),
  end: new Date(2025, 3, 21),
  totalDays: 4,
  cost: 0,
  days: [
    { date: new Date(2025, 3, 18), isFree: true, holidayName: 'Goede Vrijdag' },
    { date: new Date(2025, 3, 19), isFree: true, holidayName: null },
    { date: new Date(2025, 3, 20), isFree: true, holidayName: 'Eerste Paasdag' },
    { date: new Date(2025, 3, 21), isFree: true, holidayName: 'Tweede Paasdag' },
  ],
};

describe('SummaryPanel', () => {
  it('renders nothing without a selected range', () => {
    const { container } = render(<SummaryPanel range={null} mode="max_free" />);

    expect(container.innerHTML).toBe('');
  });

  it('summarises the selected range', () => {
    const { container } = render(<SummaryPanel range={range} mode="max_free" />);

    expect(find(container, 'h3').textContent).toBe('Samenvatting');
    expect(container.textContent).toContain('18 apr 2025 - 21 apr 2025');
    expect(container.textContent).toContain('4 dagen vrij voor 0 verlofdagen');
    expect(container.textContent).toContain('3 feestdagen');
    expect(container.textContent).toContain('4 dagen vrij, waarvan 0 al gemarkeerd');
    expect(findAll(container, '.summary-weekdays span')).toHaveLength(7);
  });

  it('uses the headline colour of the active calculator mode', () => {
    const { container } = render(<SummaryPanel range={range} mode="find_range" />);

    expect(find(container, '.summary-panel').className).toContain('headline-secondary');
  });

  it('counts the days that are already listed in the calendar breakdown', () => {
    const marker = document.createElement('div');
    marker.className = 'list-item';
    marker.textContent = '18 apr 2025';
    document.body.appendChild(marker);

    const { container } = render(<SummaryPanel range={range} mode="max_free" />);

    expect(container.textContent).toContain('waarvan 1 al gemarkeerd');
  });

  it('copies the summary text to the clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const { container } = render(<SummaryPanel range={range} mode="max_free" />);

    click(find(container, 'button'));
    await flush();

    expect(writeText).toHaveBeenCalledWith('4 dagen vrij voor 0 verlofdagen (3 feestdagen)');
    expect(find(container, 'button').textContent).toBe('Gekopieerd!');
  });

  it('hides the holiday note when the stored preference turns it off', () => {
    localStorage.setItem('summary-panel-prefs', JSON.stringify({ showHolidays: false }));
    const { container } = render(<SummaryPanel range={range} mode="max_free" />);

    expect(container.textContent).not.toContain('feestdagen tellen mee als vrije dagen');
  });

  it('ignores unreadable preferences and keeps the holiday note', () => {
    localStorage.setItem('summary-panel-prefs', '{not json');
    const { container } = render(<SummaryPanel range={range} mode="max_free" />);

    expect(container.textContent).toContain('Let op: feestdagen tellen mee als vrije dagen.');
  });

  it('keeps the holiday note out when nothing has been stored yet', () => {
    // Nothing stored -> JSON.parse(null) is null -> the note stays hidden.
    const { container } = render(<SummaryPanel range={range} mode="max_free" />);

    expect(container.textContent).not.toContain('feestdagen tellen mee als vrije dagen.');
  });

  it('shows a different range when the selection changes', () => {
    const shorter = { ...range, end: new Date(2025, 3, 19) };
    const { container } = render(<SummaryPanel range={shorter} mode="best_ratio" />);

    expect(container.textContent).toContain('18 apr 2025 - 19 apr 2025');
    expect(find(container, '.summary-panel').className).toContain('headline-success');
  });
});
