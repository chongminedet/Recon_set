import React from 'react';

const THEMES = [
  { id: 'phantom', name: 'Phantom', color: '#00ff88' },
  { id: 'midnight', name: 'Midnight', color: '#7c5cff' },
  { id: 'ocean', name: 'Ocean', color: '#00d4ff' },
  { id: 'synthwave', name: 'Synthwave', color: '#ff6ec7' },
  { id: 'crimson', name: 'Crimson', color: '#ff3344' },
  { id: 'catppuccin', name: 'Catppuccin', color: '#cba6f7' },
  { id: 'light', name: 'Light', color: '#f0f2f5' },
];

const styles = {
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  card: (isActive, color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    background: isActive ? 'rgba(0, 255, 136, 0.08)' : 'var(--color-bg-primary)',
    border: `2px solid ${isActive ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
    borderRadius: 'var(--border-radius)',
    cursor: 'var(--cursor-pointer)',
    transition: 'all 150ms ease-out',
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    fontWeight: isActive ? '700' : '500',
    color: isActive ? 'var(--color-accent-primary)' : 'var(--color-text-secondary)',
    boxShadow: isActive ? '0 0 12px rgba(0, 255, 136, 0.15)' : 'none',
  }),
  swatch: (color) => ({
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    border: '2px solid rgba(255,255,255,0.1)',
  }),
  name: {
    whiteSpace: 'nowrap',
  },
};

export function ThemeSwitcher({ currentTheme, onThemeChange }) {
  return (
    <div style={styles.grid}>
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          style={styles.card(currentTheme === theme.id, theme.color)}
          onClick={() => onThemeChange(theme.id)}
          onMouseEnter={(e) => {
            if (currentTheme !== theme.id) {
              e.currentTarget.style.borderColor = theme.color;
              e.currentTarget.style.color = theme.color;
            }
          }}
          onMouseLeave={(e) => {
            if (currentTheme !== theme.id) {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.color = '';
            }
          }}
        >
          <span style={styles.swatch(theme.color)} />
          <span style={styles.name}>{theme.name}</span>
        </button>
      ))}
    </div>
  );
}
