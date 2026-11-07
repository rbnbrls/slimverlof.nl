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
    expect(findAll(container, '.scenario-card')).toHaveLength(3);
    expect(container.textContent).toContain('Maximaliseer je vrije tijd');
  });

  it('restarts the wizard from the wizard button and the clickable title', () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Kies je gewenste vrije periode'));
    expect(find(container, '#targetLength')).toBeTruthy();

    click(buttonByText(container, 'Opnieuw beginnen'));
    expect(find(container, '.scenario-card')).toBeTruthy();
    expect(find(container, '#page-title').textContent).toBe('slimverlof.nl');

    click(find(container, '.brand-button'));
    expect(find(container, '.scenario-card')).toBeTruthy();
    expect(find(container, '[aria-label="Verlofplanner wizard"]').textContent).toContain('Stap 1 van 4');
  });

  it('can plan multiple vacation blocks from the max-free scenario', async () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Maximaliseer je vrije tijd'));
    click(find(container, '#multipleBlocks'));
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Bereken mijn verlof'));
    await settle();

    expect(find(container, '.result-title').textContent).toBe('Jouw vakantieblokken');
    expect(findAll(container, '.ranking-row').length).toBeGreaterThan(0);
  });

  it('switches to the "how long do you want to be free" mode', () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Kies je gewenste vrije periode'));

    expect(find(container, '#targetLength').value).toBe('14');
    expect(container.textContent).toContain('Hoeveel dagen wil je aaneengesloten vrij zijn?');
    expect(container.querySelector('#vacationDays')).toBeNull();
  });

  it('exposes active mode state and announces mode changes', () => {
    const { container } = render(<App />);
    click(buttonByText(container, 'Kies je gewenste vrije periode'));

    expect(find(container, '#targetLength')).toBeTruthy();
    expect(find(container, '[aria-live="polite"]').textContent).toContain('Dagen vrij geopend');
  });

  it('recalculates the result when the number of vacation days changes', async () => {
    const { container } = render(<App />);
    click(buttonByText(container, 'Maximaliseer je vrije tijd'));
    await settle();
    const before = container.textContent;

    setInputValue(find(container, '#vacationDays'), '3');
    await settle();

    expect(find(container, '#vacationDays').value).toBe('3');
    expect(container.textContent).not.toBe(before);
  });

  it('explains the result in days instead of using a factor', async () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Kies je gewenste vrije periode'));
    setInputValue(find(container, '#targetLength'), '14');
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Bereken mijn verlof'));
    await settle();

    const summary = find(container, '.result-summary').textContent;
    expect(summary).toContain('Je wil 14 dagen vrij');
    expect(summary).toContain('verlofdagen');
    expect(summary).toContain('dagen cadeau');
    expect(summary).not.toContain('factor');
  });

  it('adds and removes work days', () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Maximaliseer je vrije tijd'));
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Za'));
    expect(findAll(container, '.day-btn.active')).toHaveLength(6);

    click(buttonByText(container, 'Za'));
    expect(findAll(container, '.day-btn.active')).toHaveLength(5);
  });

  it('narrows the search window when the dates change', async () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Maximaliseer je vrije tijd'));
    click(buttonByText(container, 'Volgende'));
    setInputValue(find(container, '#startDate'), '2025-04-18');
    setInputValue(find(container, '#endDate'), '2025-05-06');
    await settle();

    expect(find(container, '#startDate').value).toBe('2025-04-18');
    expect(find(container, '#endDate').value).toBe('2025-05-06');
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Bereken mijn verlof'));
    await settle();
    expect(container.textContent).toContain('18 apr.');
  });

  it('ranks the best ratio periods and opens the calendar for a selection', async () => {
    const { container } = render(<App />);

    click(buttonByText(container, 'Bekijk 6 suggesties'));
    click(buttonByText(container, 'Volgende'));
    setInputValue(find(container, '#startDate'), '2025-04-01');
    setInputValue(find(container, '#endDate'), '2025-06-30');
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Bereken mijn verlof'));
    await settle();

    const rows = findAll(container, '.ranking-row');
    expect(rows.length).toBeGreaterThan(0);
    expect(container.textContent).toContain('6 suggesties');
    expect(container.textContent).toContain('Feestdag:');
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

    click(buttonByText(container, 'Bekijk 6 suggesties'));
    setInputValue(find(container, '#availableDays'), '1');
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Volgende'));
    click(buttonByText(container, 'Bereken mijn verlof'));
    await settle();
    expect(findAll(container, '.ranking-row.not-affordable').length).toBeGreaterThan(0);
  });

  it('shows the school holiday overview in the last mode', () => {
    const { container } = render(<App />);
    const schoolButton = find(container, '.header-controls button[title="Schoolvakanties"]');

    click(schoolButton);

    expect(container.textContent).toContain('Schoolvakanties 2026-2027');
    expect(container.querySelector('.wizard')).toBeNull();

    // Switching back restores the calculator inputs.
    click(schoolButton);
    expect(find(container, '.wizard')).toBeTruthy();
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
