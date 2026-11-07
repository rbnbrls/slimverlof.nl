import { useTheme } from '../hooks/useTheme';

export default function ThemeSelector() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const nextLabel = isDark ? 'lichte' : 'donkere';

  return (
    <div className="theme-selector-container">
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle"
        title={`Schakel naar ${nextLabel} modus`}
        data-tooltip={`Schakel naar ${nextLabel} modus`}
        aria-label={`Schakel naar ${nextLabel} modus`}
        aria-pressed={isDark}
      >
        <span className="theme-icon" aria-hidden="true">
          {isDark ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.6 6.6 0 0 0 21 12.8Z" />
            </svg>
          )}
        </span>
      </button>
    </div>
  );
}
