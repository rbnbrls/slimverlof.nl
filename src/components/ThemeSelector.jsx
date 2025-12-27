import { motion } from 'framer-motion';
import { useTheme } from '../hooks/useTheme';

export default function ThemeSelector() {
    const { theme, toggleTheme } = useTheme();

    const options = [
        { id: 'light', icon: '☀️', label: 'Light' },
        { id: 'system', icon: '🌓', label: 'Auto' },
        { id: 'dark', icon: '🌙', label: 'Dark' },
    ];

    return (
        <div className="theme-selector-container">
            <div className="theme-segmented-control">
                {options.map((option) => (
                    <button
                        key={option.id}
                        onClick={() => toggleTheme(option.id)}
                        className={`theme-segment ${theme === option.id ? 'active' : ''}`}
                        title={option.label}
                    >
                        {theme === option.id && (
                            <motion.div
                                layoutId="activeTheme"
                                className="theme-active-bg"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        <span className="theme-icon">{option.icon}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
