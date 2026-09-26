import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import App from '../src/App.jsx';
import {
  buttonByText,
  click,
  find,
  findAll,
  render,
  setInputValue,
  settle,
  stubClipboard,
} from './helpers/dom.js';

const flush = () => act(async () => {});

describe('App', () => {
  it('renders the planner with the default max-free calculation', () => {
    const { container } = render(<App />);

    expect(find(container, '.title').textContent).toBe('slimverlof.nl');
    expect(find(container, '#vacationDays').value).toBe('20');
    expect(findAll(container, '.mode-btn')).toHaveLength(3);
    expect(find(container, '.mode-btn.active').textContent).toBe('Verlof inzetten');
    expect(findAll(container, '.day-btn.active')).toHaveLength(5);
  });

  it('switches to the "how long do you want to be free" mode', () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Dagen vrij'));

    expect(find(container, '#targetLength').value).toBe('14');
    expect(find(container, '.mode-btn.active').textContent).toBe('Dagen vrij');
    expect(container.querySelector('#vacationDays')).toBeNull();
  });

  it('recalculates the result when the number of vacation days changes', async () => {
    const { container } = render(<App />);
    await settle();
    const before = container.textContent;

    setInputValue(find(container, '#vacationDays'), '3');
    await settle();

    expect(find(container, '#vacationDays').value).toBe('3');
    expect(container.textContent).not.toBe(before);
  });

  it('adds and removes work days', () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Za'));
    expect(findAll(container, '.day-btn.active')).toHaveLength(6);

    click(buttonByText(container, 'Za'));
    expect(findAll(container, '.day-btn.active')).toHaveLength(5);
  });

  it('narrows the search window when the dates change', async () => {
    const { container } = render(<App />);

    setInputValue(find(container, '#startDate'), '2025-04-18');
    setInputValue(find(container, '#endDate'), '2025-05-06');
    await settle();

    expect(find(container, '#startDate').value).toBe('2025-04-18');
    expect(find(container, '#endDate').value).toBe('2025-05-06');
    expect(container.textContent).toContain('18 apr.');
  });

  it('ranks the best ratio periods and opens the calendar for a selection', async () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Top 10 Beste Factor'));
    setInputValue(find(container, '#startDate'), '2025-04-01');
    setInputValue(find(container, '#endDate'), '2025-06-30');
    await settle();

    const rows = findAll(container, '.ranking-row');
    expect(rows.length).toBeGreaterThan(0);
    expect(container.textContent).toContain('🏆 Top 10 Beste Factor');
    expect(container.textContent).toContain('🎉');
    expect(findAll(container, '.affordable-info').length).toBeLessThanOrEqual(1);

    click(rows[0]);
    await settle();
    expect(findAll(container, '.calendar-container')).toHaveLength(1);

    // Known quirk: the rows are rebuilt on every render, so the `selected`
    // highlight never sticks even though the calendar does follow the click.
    // Clicking another period therefore replaces the calendar, not stacks it.
    click(findAll(container, '.ranking-row')[1]);
    await settle();
    expect(findAll(container, '.calendar-container')).toHaveLength(1);
  });

  it('limits the ranking when fewer vacation days are available', async () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Top 10 Beste Factor'));
    await settle();
    expect(findAll(container, '.ranking-row.affordable').length).toBeGreaterThan(0);

    setInputValue(find(container, '#availableDays'), '1');
    await settle();

    expect(findAll(container, '.ranking-row.not-affordable').length).toBeGreaterThan(0);
  });

  it('shows the school holiday overview in the last mode', () => {
    const { container } = render(<App />);
    const schoolButton = find(container, '.header-controls button[title="Schoolvakanties"]');

    click(schoolButton);

    expect(container.textContent).toContain('Schoolvakanties 2025-2026');
    expect(container.querySelector('.input-grid')).toBeNull();

    // Switching back restores the calculator inputs.
    click(schoolButton);
    expect(find(container, '.input-grid')).toBeTruthy();
  });

  it('shares the page from the header', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubClipboard(writeText);
    const { container } = render(<App />);

    click(find(container, '.share-container .share-btn'));
    click(find(container, '.share-menu-item'));
    await flush();

    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });
});
