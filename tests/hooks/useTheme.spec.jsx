import { describe, expect, it } from 'vitest';
import { useTheme } from '../../src/hooks/useTheme.js';
import { buttonByText, click, mediaListenerCount, render, setPrefersDark } from '../helpers/dom.js';

function ThemeProbe() {
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  return (
    <div>
      <span id="theme">{theme}</span>
      <span id="resolved-theme">{resolvedTheme}</span>
      <button onClick={() => toggleTheme()}>cycle</button>
    </div>
  );
}

const currentTheme = (container) => container.querySelector('#theme').textContent;
const resolvedTheme = (container) => container.querySelector('#resolved-theme').textContent;
const appliedTheme = () => document.documentElement.getAttribute('data-theme');

describe('useTheme', () => {
  it('starts in system mode and follows the operating system preference', () => {
    setPrefersDark(true);
    const { container } = render(<ThemeProbe />);

    expect(currentTheme(container)).toBe('system');
    expect(appliedTheme()).toBe('dark');
  });

  it('falls back to the light theme when the system prefers light', () => {
    render(<ThemeProbe />);

    expect(appliedTheme()).toBe('light');
  });

  it('restores a stored theme', () => {
    localStorage.setItem('theme', 'dark');
    const { container } = render(<ThemeProbe />);

    expect(currentTheme(container)).toBe('dark');
    expect(appliedTheme()).toBe('dark');
  });

  it('toggles from the system theme to the opposite explicit theme', () => {
    const { container } = render(<ThemeProbe />);
    const cycle = buttonByText(container, 'cycle');

    click(cycle);
    expect(currentTheme(container)).toBe('dark');
    expect(resolvedTheme(container)).toBe('dark');
    expect(appliedTheme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    click(cycle);
    expect(currentTheme(container)).toBe('light');
    expect(resolvedTheme(container)).toBe('light');
    expect(appliedTheme()).toBe('light');
  });

  it('reacts to a system theme change while in system mode', () => {
    const { container } = render(<ThemeProbe />);
    expect(appliedTheme()).toBe('light');

    setPrefersDark(true);
    expect(appliedTheme()).toBe('dark');
    expect(currentTheme(container)).toBe('system');
  });

  it('unsubscribes from the system preference on unmount', () => {
    const { unmount } = render(<ThemeProbe />);
    expect(mediaListenerCount()).toBe(1);

    unmount();
    expect(mediaListenerCount()).toBe(0);
  });
});
