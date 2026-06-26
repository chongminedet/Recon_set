import { useState, useEffect, useCallback } from 'react';

const THEMES = {
  phantom: {
    name: 'Phantom',
    color: '#00ff88',
    stroke: '#00ff88',
    fill: '#c8d0e0',
    eye: '#0a0f1a',
  },
  midnight: {
    name: 'Midnight',
    color: '#7c5cff',
    stroke: '#7c5cff',
    fill: '#c8d0e0',
    eye: '#0a0f1a',
  },
  ocean: {
    name: 'Ocean',
    color: '#00d4ff',
    stroke: '#00d4ff',
    fill: '#c8d0e0',
    eye: '#0a0f1a',
  },
  synthwave: {
    name: 'Synthwave',
    color: '#ff6ec7',
    stroke: '#ff6ec7',
    fill: '#c8d0e0',
    eye: '#0a0f1a',
  },
  crimson: {
    name: 'Crimson',
    color: '#ff3344',
    stroke: '#ff3344',
    fill: '#c8d0e0',
    eye: '#0a0f1a',
  },
  catppuccin: {
    name: 'Catppuccin',
    color: '#cba6f7',
    stroke: '#cba6f7',
    fill: '#cdd6f4',
    eye: '#1e1e2e',
  },
  light: {
    name: 'Light',
    color: '#0866ff',
    stroke: '#0866ff',
    fill: '#3a3f5a',
    eye: '#ffffff',
  },
};

function e(s) { return encodeURIComponent(s).replace(/'/g, '%27'); }

function ghostNormal(stroke, fill, eye) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='38' viewBox='0 0 32 38'><path d='M16 2C9.37 2 4 7.37 4 14v6c0 2.95-1.2 4.8-2.8 6.2l0.6 1.6C3.5 28.9 4.9 30 6.5 30c1.1 0 2.1-.45 2.8-1.15C10.8 29.55 13.3 30 16 30s5.2-.45 6.7-1.15C23.4 29.55 24.4 30 25.5 30c1.6 0 3-.9 4.7-1.85L30.8 26.2C29.2 24.8 28 22.95 28 20v-6C28 7.37 22.63 2 16 2z' fill='${e(fill)}' stroke='${e(stroke)}' stroke-width='1'/><circle cx='12' cy='14' r='2.2' fill='${e(eye)}'/><circle cx='20' cy='14' r='2.2' fill='${e(eye)}'/><circle cx='13' cy='13.2' r='0.7' fill='rgba(255,255,255,0.6)'/><circle cx='21' cy='13.2' r='0.7' fill='rgba(255,255,255,0.6)'/><path d='M13 20v1.8M16 20v1.8M19 20v1.8' stroke='${e(eye)}' stroke-width='1.4' stroke-linecap='round'/><path d='M11 22h10' stroke='${e(eye)}' stroke-width='1' stroke-linecap='round'/><circle cx='3' cy='2' r='1.2' fill='${e(stroke)}' opacity='0.7'/></svg>`;
}

function ghostLink(stroke) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='40' viewBox='0 0 32 40'><path d='M17 2C10.37 2 5 7.37 5 14v5c0 2.5-1 4.4-2.5 5.8l0.5 1.4C4.7 27.9 6 29 7.5 29c1 0 2-.4 2.7-1.1C11.7 28.6 14 29 17 29s5.3-.4 6.8-1.1C24.5 28.6 25.5 29 26.5 29c1.5 0 2.8-.9 4.2-1.7L31.2 26C29.8 24.6 29 22.5 29 20v-6C29 7.37 23.63 2 17 2z' fill='${e(stroke)}' stroke='${e(stroke)}' stroke-width='1'/><circle cx='13' cy='13.5' r='2.2' fill='%230a0f1a'/><circle cx='21' cy='13.5' r='2.2' fill='%230a0f1a'/><circle cx='14' cy='12.7' r='0.7' fill='rgba(255,255,255,0.6)'/><circle cx='22' cy='12.7' r='0.7' fill='rgba(255,255,255,0.6)'/><path d='M14 19.5v1.8M17 19.5v1.8M20 19.5v1.8' stroke='%230a0f1a' stroke-width='1.4' stroke-linecap='round'/><path d='M12 21.5h10' stroke='%230a0f1a' stroke-width='1' stroke-linecap='round'/><path d='M17 29v5' stroke='${e(stroke)}' stroke-width='3' stroke-linecap='round'/><circle cx='17' cy='35.5' r='2' fill='${e(stroke)}' stroke='%2300cc6a' stroke-width='0.8'/><circle cx='17' cy='35.5' r='1' fill='rgba(255,255,255,0.4)'/></svg>`;
}

function ghostText(stroke) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='38' viewBox='0 0 32 38'><path d='M16 3C10.48 3 6 7.48 6 13v5c0 2.2-.9 3.9-2.1 5.1l0.4 1.2C5.6 25.9 6.8 27 8.2 27c.9 0 1.7-.35 2.3-.95C12 26.6 13.9 27 16 27s4-.4 5.5-.95c.6.6 1.4.95 2.3.95 1.4 0 2.6-.9 3.9-1.65L28.1 23.1C26.9 21.9 26 20.2 26 18v-5C26 7.48 21.52 3 16 3z' fill='%23c8d0e0' stroke='${e(stroke)}' stroke-width='1'/><circle cx='12.5' cy='13' r='2' fill='%230a0f1a'/><circle cx='19.5' cy='13' r='2' fill='%230a0f1a'/><circle cx='13.2' cy='12.3' r='0.6' fill='rgba(255,255,255,0.6)'/><circle cx='20.2' cy='12.3' r='0.6' fill='rgba(255,255,255,0.6)'/><path d='M13.5 18.5v1.6M16 18.5v1.6M18.5 18.5v1.6' stroke='%230a0f1a' stroke-width='1.2' stroke-linecap='round'/><line x1='16' y1='27' x2='16' y2='36' stroke='${e(stroke)}' stroke-width='1.8' stroke-linecap='round'/><line x1='13' y1='27.5' x2='19' y2='27.5' stroke='${e(stroke)}' stroke-width='1.5' stroke-linecap='round'/><line x1='13' y1='35.5' x2='19' y2='35.5' stroke='${e(stroke)}' stroke-width='1.5' stroke-linecap='round'/></svg>`;
}

function ghostWait() {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='12' fill='%230a0f1a' stroke='%23ffa500' stroke-width='1.5'/><path d='M16 6a10 10 0 0 1 10 10' stroke='%23ffa500' stroke-width='2' stroke-linecap='round'/><circle cx='16' cy='16' r='2' fill='%23ffa500'/><path d='M13 10v3M19 10v3' stroke='%23ffa500' stroke-width='1.5' stroke-linecap='round'/></svg>`;
}

function ghostCrosshair(fill) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='10' fill='none' stroke='${e(fill)}' stroke-width='1'/><path d='M16 2v28M2 16h28' stroke='${e(fill)}' stroke-width='1' stroke-linecap='round'/><circle cx='16' cy='16' r='2' fill='%2300ff88'/><circle cx='12' cy='14' r='1.5' fill='%230a0f1a'/><circle cx='20' cy='14' r='1.5' fill='%230a0f1a'/></svg>`;
}

function ghostNotAllowed() {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='16' r='12' fill='%230a0f1a' stroke='%23ff006e' stroke-width='1.5'/><path d='M9 9l14 14' stroke='%23ff006e' stroke-width='2' stroke-linecap='round'/><circle cx='12' cy='14' r='1.5' fill='%23ff006e'/><circle cx='20' cy='14' r='1.5' fill='%23ff006e'/></svg>`;
}

function ghostMove(fill) {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><path d='M16 4l4 4-4 4M16 24l-4-4 4-4M4 16l4-4 4 4M24 16l-4 4-4-4' stroke='${e(fill)}' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/><circle cx='16' cy='16' r='3' fill='%2300ff88'/><circle cx='14' cy='15' r='1' fill='%230a0f1a'/><circle cx='18' cy='15' r='1' fill='%230a0f1a'/></svg>`;
}

function ghostHelp() {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='16' cy='14' r='10' fill='%230a0f1a' stroke='%2300d4ff' stroke-width='1.5'/><path d='M12 14a4 4 0 0 1 8 0c0 2-2 2.5-2 4' stroke='%2300d4ff' stroke-width='1.5' stroke-linecap='round'/><circle cx='16' cy='21' r='1.2' fill='%2300d4ff'/><circle cx='13' cy='12.5' r='1.5' fill='%2300d4ff'/><circle cx='19' cy='12.5' r='1.5' fill='%2300d4ff'/><path d='M16 24v6' stroke='%2300d4ff' stroke-width='1.5' stroke-linecap='round'/></svg>`;
}

function buildCursorSvg(type, theme) {
  const s = theme.stroke, f = theme.fill, ey = theme.eye;
  let svg, x, y, fb;
  switch (type) {
    case 'default':
      svg = ghostNormal(s, f, ey); x = 3; y = 2; fb = 'auto'; break;
    case 'pointer':
      svg = ghostLink(s); x = 17; y = 2; fb = 'pointer'; break;
    case 'text':
      svg = ghostText(s); x = 16; y = 3; fb = 'text'; break;
    case 'wait':
      svg = ghostWait(); x = 16; y = 16; fb = 'wait'; break;
    case 'crosshair':
      svg = ghostCrosshair(f); x = 16; y = 16; fb = 'crosshair'; break;
    case 'not-allowed':
      svg = ghostNotAllowed(); x = 16; y = 16; fb = 'not-allowed'; break;
    case 'move':
      svg = ghostMove(f); x = 16; y = 16; fb = 'move'; break;
    case 'help':
      svg = ghostHelp(); x = 24; y = 4; fb = 'help'; break;
    default:
      svg = ghostNormal(s, f, ey); x = 3; y = 2; fb = 'auto';
  }
  return `url("data:image/svg+xml,${svg}") ${x} ${y}, ${fb}`;
}

function applyCursorTheme(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--cursor-default', buildCursorSvg('default', theme));
  root.style.setProperty('--cursor-pointer', buildCursorSvg('pointer', theme));
  root.style.setProperty('--cursor-text', buildCursorSvg('text', theme));
  root.style.setProperty('--cursor-wait', buildCursorSvg('wait', theme));
  root.style.setProperty('--cursor-crosshair', buildCursorSvg('crosshair', theme));
  root.style.setProperty('--cursor-not-allowed', buildCursorSvg('not-allowed', theme));
  root.style.setProperty('--cursor-move', buildCursorSvg('move', theme));
  root.style.setProperty('--cursor-help', buildCursorSvg('help', theme));
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
