import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/themeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'فعال کردن حالت روشن' : 'فعال کردن حالت تاریک';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`premium-interactive group relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-card text-ink-muted shadow-sm hover:border-brand-300 hover:text-brand-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${className}`}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
    >
      <SunIcon
        aria-hidden="true"
        className={`absolute h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-50 opacity-0'}`}
      />
      <MoonIcon
        aria-hidden="true"
        className={`absolute h-5 w-5 transition-all duration-300 ${isDark ? 'rotate-90 scale-50 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
      />
    </button>
  );
}
