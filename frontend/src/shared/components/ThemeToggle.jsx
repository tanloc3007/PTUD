import React from 'react';

/**
 * Modern Sun/Moon Theme Toggle Component with smooth SVG animations
 */
export function ThemeToggle({ theme, onToggle, isDark, style = {} }) {
  const currentIsDark = isDark !== undefined ? isDark : theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={currentIsDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      title={currentIsDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: 10,
        border: '1px solid var(--a-border, var(--e-border, var(--s-border, #e5e7eb)))',
        background: currentIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
        color: currentIsDark ? '#fbbf24' : '#4f46e5',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        padding: 0,
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.background = currentIsDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.06)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = currentIsDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)';
      }}
    >
      {currentIsDark ? (
        // Moon Icon 🌙
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#f59e0b" fillOpacity="0.2" />
        </svg>
      ) : (
        // Sun Icon ☀️
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#eab308"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" fill="#fef08a" fillOpacity="0.6" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
