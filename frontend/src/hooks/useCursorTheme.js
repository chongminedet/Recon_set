import { useState, useEffect, useCallback } from 'react';

const THEMES = {
  phantom: {
    name: 'Phantom',
    color: '#00ff88',
    cursorStroke: '#00ff88',
    cursorFill: '#c8d0e0',
    cursorEye: '#0a0f1a',
  },
  midnight: {
    name: 'Midnight',
    color: '#7c5cff',
    cursorStroke: '#7c5cff',
    cursorFill: '#c8d0e0',
    cursorEye: '#0a0f1a',
  },
  ocean: {
    name: 'Ocean',
    color: '#00d4ff',
    cursorStroke: '#00d4ff',
    cursorFill: '#c8d0e0',
    cursorEye: '#0a0f1a',
  },
  synthwave: {
    name: 'Synthwave',
    color: '#ff6ec7',
    cursorStroke: '#ff6ec7',
    cursorFill: '#c8d0e0',
    cursorEye: '#0a0f1a',
  },
  crimson: {
    name: 'Crimson',
    color: '#ff3344',
    cursorStroke: '#ff3344',
    cursorFill: '#c8d0e0',
    cursorEye: '#0a0f1a',
  },
  catppuccin: {
    name: 'Catppuccin',
    color: '#cba6f7',
    cursorStroke: '#cba6f7',
    cursorFill: '#cdd6f4',
    cursorEye: '#1e1e2e',
  },
  light: {
    name: 'Light',
    color: '#0866ff',
    cursorStroke: '#0866ff',
    cursorFill: '#3a3f5a',
    cursorEye: '#ffffff',
  },
};

function buildCursorSvg(stroke, fill, eye, size, type) {
  const w = size;
  const h = Math.round(size * 1.125);

  const bodyPath =
    type === 'pointer'
      ? `M${w / 2} 1C${w * 0.293} 1 4 6.37 4 13v5c0 2.95-1.49 5.51-3.76 7.03.12.91.45 1.75.97 2.47C2.45 29.57 3.85 31 ${w / 2 - 10}.67 31c1.23 0 2.33-.5 3.13-1.3C10 30.04 12.88 31 ${w / 2} 31s6-.96 7.2-1.3c.8.8 1.9 1.3 3.13 1.3 1.82 0 3.22-1.43 3.76-3.49.52-.72.85-1.56.97-2.47C28.76 23.51 27.28 20.95 27.28 18v-5C27.28 6.37 21.91 1 ${w / 2} 1z`
      : `M${w / 2} 2C${w * 0.293} 2 4 7.37 4 14v4c0 2.95-1.49 5.51-3.76 7.03.12.91.45 1.75.97 2.47C2.45 28.57 3.85 30 ${w / 2 - 10}.67 30c1.23 0 2.33-.5 3.13-1.3C10 29.04 12.88 30 ${w / 2} 30s6-.96 7.2-1.3c.8.8 1.9 1.3 3.13 1.3 1.82 0 3.22-1.43 3.76-3.49.52-.72.85-1.56.97-2.47C28.76 22.51 27.28 19.95 27.28 17v-3C27.28 7.37 21.91 2 ${w / 2} 2z`;

  const mouthPaths =
    type === 'text'
      ? ''
      : `<path d="M13.5 20v2M16 20v2M18.5 20v2" stroke="${encodeURIComponent(eye)}" stroke-width="1.5" stroke-linecap="round"/><path d="M11 22h10" stroke="${encodeURIComponent(eye)}" stroke-width="1" stroke-linecap="round"/>`;

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 32 36'><path d='${bodyPath}' fill='${encodeURIComponent(fill)}' stroke='${encodeURIComponent(stroke)}' stroke-width='1'/><circle cx='12' cy='13' r='2.5' fill='${encodeURIComponent(eye)}'/><circle cx='20' cy='13' r='2.5' fill='${encodeURIComponent(eye)}'/>${mouthPaths}</svg>`;

  const x = type === 'pointer' ? 10 : 8;
  const fallback = type === 'pointer' ? 'pointer' : type === 'text' ? 'text' : 'auto';

  return `url("data:image/svg+xml,${svg}") ${x} 4, ${fallback}`;
}

function buildFaviconCursor(type) {
  const x = type === 'pointer' ? 10 : 8;
  const fallback = type === 'pointer' ? 'pointer' : type === 'text' ? 'text' : 'auto';
  return `url("/favicon.svg") ${x} 4, ${fallback}`;
}

function applyCursorTheme(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return;

  const root = document.documentElement;

  const defaultCursor = buildFaviconCursor('default');
  const pointerCursor = buildFaviconCursor('pointer');
  const textCursor = buildCursorSvg(theme.cursorStroke, theme.cursorFill, theme.cursorEye, 24, 'text');

  root.style.setProperty('--cursor-default', defaultCursor);
  root.style.setProperty('--cursor-pointer', pointerCursor);
  root.style.setProperty('--cursor-text', textCursor);
}

export function useCursorTheme() {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 'phantom';
  });

  useEffect(() => {
    applyCursorTheme(currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme') || 'phantom';
          setCurrentTheme(newTheme);
        }
      }
    });

    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  const updateCursorTheme = useCallback((themeId) => {
    if (THEMES[themeId]) {
      document.documentElement.setAttribute('data-theme', themeId);
      setCurrentTheme(themeId);
      applyCursorTheme(themeId);
    }
  }, []);

  return { currentTheme, updateCursorTheme, themes: THEMES };
}
