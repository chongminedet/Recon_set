import { useState, useEffect, useCallback } from 'react';

const THEMES = {
  phantom: {
    name: 'Phantom',
    color: '#00ff88',
  },
  midnight: {
    name: 'Midnight',
    color: '#7c5cff',
  },
  ocean: {
    name: 'Ocean',
    color: '#00d4ff',
  },
  synthwave: {
    name: 'Synthwave',
    color: '#ff6ec7',
  },
  crimson: {
    name: 'Crimson',
    color: '#ff3344',
  },
  catppuccin: {
    name: 'Catppuccin',
    color: '#cba6f7',
  },
  light: {
    name: 'Light',
    color: '#0866ff',
  },
};

const CURSOR_PACK = {
  default: '/cursors/normal.svg',
  pointer: '/cursors/link.svg',
  text: '/cursors/text.svg',
  wait: '/cursors/wait.svg',
  crosshair: '/cursors/crosshair.svg',
  'not-allowed': '/cursors/not-allowed.svg',
  move: '/cursors/move.svg',
  help: '/cursors/help.svg',
};

const CURSOR_HOTSPOTS = {
  default: { x: 3, y: 2 },
  pointer: { x: 17, y: 2 },
  text: { x: 16, y: 3 },
  wait: { x: 16, y: 16 },
  crosshair: { x: 16, y: 16 },
  'not-allowed': { x: 16, y: 16 },
  move: { x: 16, y: 16 },
  help: { x: 24, y: 4 },
};

function buildCursorUrl(type) {
  const url = CURSOR_PACK[type] || CURSOR_PACK.default;
  const hotspot = CURSOR_HOTSPOTS[type] || CURSOR_HOTSPOTS.default;
  const fallback = type === 'pointer' ? 'pointer' : type === 'text' ? 'text' : type === 'wait' ? 'wait' : type === 'crosshair' ? 'crosshair' : type === 'not-allowed' ? 'not-allowed' : type === 'move' ? 'move' : type === 'help' ? 'help' : 'auto';
  return `url("${url}") ${hotspot.x} ${hotspot.y}, ${fallback}`;
}

function applyCursorTheme(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return;

  const root = document.documentElement;

  root.style.setProperty('--cursor-default', buildCursorUrl('default'));
  root.style.setProperty('--cursor-pointer', buildCursorUrl('pointer'));
  root.style.setProperty('--cursor-text', buildCursorUrl('text'));
  root.style.setProperty('--cursor-wait', buildCursorUrl('wait'));
  root.style.setProperty('--cursor-crosshair', buildCursorUrl('crosshair'));
  root.style.setProperty('--cursor-not-allowed', buildCursorUrl('not-allowed'));
  root.style.setProperty('--cursor-move', buildCursorUrl('move'));
  root.style.setProperty('--cursor-help', buildCursorUrl('help'));
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
