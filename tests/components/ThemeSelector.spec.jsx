import { describe, expect, it } from 'vitest';
import ThemeSelector from '../../src/components/ThemeSelector.jsx';
import { click, find, render } from '../helpers/dom.js';

const appliedTheme = () => document.documentElement.getAttribute('data-theme');

describe('ThemeSelector', () => {
  it('renders one toggle button and follows the system theme by default', () => {
    const { container } = render(<ThemeSelector />);

    const button = find(container, '.theme-toggle');
    expect(button.title).toBe('Schakel naar donkere modus');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('switches to the opposite theme with one click', () => {
    const { container } = render(<ThemeSelector />);
    const themeButton = find(container, '.theme-toggle');

    click(themeButton);

    expect(appliedTheme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(themeButton.title).toBe('Schakel naar lichte modus');
    expect(themeButton.getAttribute('aria-pressed')).toBe('true');
  });
});
