import { describe, expect, it } from 'vitest';
import ThemeSelector from '../../src/components/ThemeSelector.jsx';
import { click, findAll, find, render } from '../helpers/dom.js';

const appliedTheme = () => document.documentElement.getAttribute('data-theme');

describe('ThemeSelector', () => {
  it('renders the three theme options with the current one active', () => {
    const { container } = render(<ThemeSelector />);

    const buttons = findAll(container, '.theme-segment');
    expect(buttons.map((button) => button.title)).toEqual(['Light', 'Auto', 'Dark']);
    expect(find(container, '.theme-segment.active').title).toBe('Auto');
    expect(findAll(container, '.theme-active-bg')).toHaveLength(1);
  });

  it('switches to the dark theme when the dark option is clicked', () => {
    const { container } = render(<ThemeSelector />);
    const darkButton = findAll(container, '.theme-segment').find((b) => b.title === 'Dark');

    click(darkButton);

    expect(appliedTheme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(find(container, '.theme-segment.active').title).toBe('Dark');
  });
});
