import React, { useState, useEffect, useMemo } from 'react';
import './frontend.css';
import { useCursorTheme } from './hooks/useCursorTheme';
import { ThemeSwitcher } from './components/ThemeSwitcher';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const THEMES = [
  { id: 'phantom', name: 'Phantom', color: '#00ff88' },
  { id: 'midnight', name: 'Midnight', color: '#7c5cff' },
  { id: 'ocean', name: 'Ocean', color: '#00d4ff' },
  { id: 'synthwave', name: 'Synthwave', color: '#ff6ec7' },
  { id: 'crimson', name: 'Crimson', color: '#ff3344' },
  { id: 'catppuccin', name: 'Catppuccin', color: '#cba6f7' },
  { id: 'light', name: 'Light', color: '#f0f2f5' },
];

const DEFAULT_SETTINGS = {
  theme: 'phantom',
  exportFormat: 'markdown',
  autoSelectAll: false,
  showToolDesc: true,
  compactMode: false,
};

const TOOL_ICONS = {
  'WHOIS': '⊕', 'DNS': '⊞', 'DNS (Full)': '⊠', 'Reverse DNS': '⇄',
  'TLS Certificate': '⊙', 'HTTP Headers': '⊘', 'Nmap Basic': '⊛',
  'Nmap Aggressive': '⚠', 'DNS Zone Transfer': '⊕', 'Sherlock': '⊕',
  'Subfinder': '◎', 'theHarvester': '⚡', 'WhatWeb': '◈', 'WAFW00F': '◆',
  'Nikto': '◇', 'Gobuster Dir': '▣', 'Gobuster DNS': '▤', 'FFUF': '▥',
  'HTTPx': '▦', 'Masscan': '▧', 'Maigret': '⊕',
};

// SVG Icon Components
const Icon = ({ name, size = 18, className = '' }) => {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    radar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
        <line x1="12" y1="2" x2="12" y2="6"/>
      </svg>
    ),
    history: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    plus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
    x: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    warning: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    chevron: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    download: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    scan: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    ghost: (
      <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M24 4C14.06 4 6 12.06 6 22v6c0 4.42-2.24 8.26-5.64 10.54.18 1.36.68 2.62 1.46 3.7C3.68 44.36 5.78 46 8.5 46c1.84 0 3.5-.74 4.7-1.94C15 45.06 19.32 46 24 46s9-.94 10.8-1.94C36 45.26 37.66 46 39.5 46c2.72 0 4.82-1.64 6.68-3.76.78-1.08 1.28-2.34 1.46-3.7C44.24 36.26 42 32.42 42 28v-6C42 12.06 33.94 4 24 4z" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="17" cy="20" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
        <circle cx="31" cy="20" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M20 30v4M24 30v4M28 30v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 33h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    port: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/>
        <line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>
    ),
    globe: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    shield: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    user: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    mail: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    zap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
    lock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  };
  return icons[name] || icons.dashboard;
};

const TOOL_DESCRIPTIONS = {
  'WHOIS': 'Domain registration details and administrative contacts.',
  'DNS': 'Standard A, AAAA, MX, and TXT record resolution.',
  'DNS (Full)': 'Comprehensive DNS record enumeration.',
  'Reverse DNS': 'PTR record lookups for target IP ranges.',
  'TLS Certificate': 'Extract Subject Alternative Names (SANs) and issuer info.',
  'HTTP Headers': 'Server identification, security headers, and tech stack mapping.',
  'Nmap Basic': 'Top 1000 TCP port scan with standard service detection.',
  'Nmap Aggressive': 'Full port range, OS detection, versioning, and default scripts.',
  'DNS Zone Transfer': 'Attempt AXFR queries against authoritative name servers.',
  'Sherlock': 'Search usernames across social media platforms.',
  'Subfinder': 'Passive subdomain enumeration using multiple sources.',
  'theHarvester': 'Gather emails, subdomains, and hosts from public sources.',
  'WhatWeb': 'Identify web technologies, CMS, frameworks, and libraries.',
  'WAFW00F': 'Detect and fingerprint Web Application Firewalls.',
  'Nikto': 'Web server vulnerability scanner with 6700+ checks.',
  'Gobuster Dir': 'Directory and file brute-force enumeration.',
  'Gobuster DNS': 'Subdomain brute-force enumeration.',
  'FFUF': 'Fast web fuzzer for directory, host, and parameter discovery.',
  'HTTPx': 'HTTP probing with title, tech detection, and status codes.',
  'Masscan': 'High-speed port scanner covering top 10000 ports.',
  'Maigret': 'Advanced username OSINT across 3000+ sites with node analysis.',
};

const TOOL_TAGS = {
  'WHOIS': 'OSINT', 'DNS': 'DNS', 'DNS (Full)': 'DNS', 'Reverse DNS': 'DNS',
  'TLS Certificate': 'TLS', 'HTTP Headers': 'HTTP', 'Nmap Basic': 'NMAP',
  'Nmap Aggressive': 'NMAP-AGGRO', 'DNS Zone Transfer': 'DNS', 'Sherlock': 'OSINT',
  'Subfinder': 'DNS', 'theHarvester': 'OSINT', 'WhatWeb': 'HTTP', 'WAFW00F': 'HTTP',
  'Nikto': 'HTTP', 'Gobuster Dir': 'HTTP', 'Gobuster DNS': 'DNS', 'FFUF': 'HTTP',
  'HTTPx': 'HTTP', 'Masscan': 'NMAP', 'Maigret': 'OSINT',
};

const SkullSVG = () => (
  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 4C14.06 4 6 12.06 6 22v6c0 4.42-2.24 8.26-5.64 10.54.18 1.36.68 2.62 1.46 3.7C3.68 44.36 5.78 46 8.5 46c1.84 0 3.5-.74 4.7-1.94C15 45.06 19.32 46 24 46s9-.94 10.8-1.94C36 45.26 37.66 46 39.5 46c2.72 0 4.82-1.64 6.68-3.76.78-1.08 1.28-2.34 1.46-3.7C44.24 36.26 42 32.42 42 28v-6C42 12.06 33.94 4 24 4z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="17" cy="20" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="31" cy="20" r="4" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M20 30v4M24 30v4M28 30v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M16 33h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function SettingsPanel({ settings, onUpdate, updateCursorTheme, currentTheme }) {
  return (
    <div className="settings-panel">
      <h2 className="settings-title">Settings</h2>
      <p className="settings-subtitle">Customize your reconnaissance environment.</p>

      <div className="settings-section">
        <h3 className="settings-section-title">Appearance</h3>
        <div className="settings-row">
          <label className="settings-label">Theme</label>
          <ThemeSwitcher
            currentTheme={currentTheme}
            onThemeChange={(theme) => {
              onUpdate({ ...settings, theme });
              if (updateCursorTheme) updateCursorTheme(theme);
            }}
          />
        </div>
        <div className="settings-row">
          <label className="settings-label">Compact Mode</label>
          <button
            className={`settings-toggle ${settings.compactMode ? 'on' : ''}`}
            onClick={() => onUpdate({ ...settings, compactMode: !settings.compactMode })}
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Scan Defaults</h3>
        <div className="settings-row">
          <label className="settings-label">Default Export Format</label>
          <select
            className="settings-select"
            value={settings.exportFormat}
            onChange={(e) => onUpdate({ ...settings, exportFormat: e.target.value })}
          >
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </select>
        </div>
        <div className="settings-row">
          <label className="settings-label">Auto-select All Tools</label>
          <button
            className={`settings-toggle ${settings.autoSelectAll ? 'on' : ''}`}
            onClick={() => onUpdate({ ...settings, autoSelectAll: !settings.autoSelectAll })}
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>
        <div className="settings-row">
          <label className="settings-label">Show Tool Descriptions</label>
          <button
            className={`settings-toggle ${settings.showToolDesc ? 'on' : ''}`}
            onClick={() => onUpdate({ ...settings, showToolDesc: !settings.showToolDesc })}
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">About</h3>
        <div className="settings-about">
          <p>Recon_Set v1.0</p>
          <p className="settings-about-sub">Automated reconnaissance framework</p>
        </div>
      </div>
    </div>
  );
}

export default function ReconApp() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('recon-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch { return DEFAULT_SETTINGS; }
  });
  const [targetType, setTargetType] = useState('Domain/IP');
  const [target, setTarget] = useState('');
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [error, setError] = useState('');
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { currentTheme, updateCursorTheme } = useCursorTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    updateCursorTheme(settings.theme);
    localStorage.setItem('recon-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch(`${API_BASE}/tools?type=${encodeURIComponent(targetType)}`);
        const data = await response.json();
        setAvailableTools(data.tools);
        if (settings.autoSelectAll) {
          setSelectedTools([...data.tools]);
        } else {
          setSelectedTools([]);
        }
      } catch (err) {
        setError('Failed to load tools');
      }
    };
    fetchTools();
  }, [targetType, settings.autoSelectAll]);

  useEffect(() => {
    if (!scanId || !scanning) return;
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/${scanId}`);
        const data = await response.json();
        setScanStatus(data);
        if (data.status === 'completed' || data.status === 'failed') {
          setScanning(false);
          setRecentActivity((prev) => [
            {
              target: target,
              status: data.status,
              tools: selectedTools,
              time: 'Just now',
              progress: data.progress,
            },
            ...prev.slice(0, 19),
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch scan status:', err);
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [scanId, scanning]);

  const filteredActivity = useMemo(() => {
    if (!searchQuery.trim()) return recentActivity;
    const q = searchQuery.toLowerCase();
    return recentActivity.filter(
      (a) =>
        a.target.toLowerCase().includes(q) ||
        a.tools.some((t) => t.toLowerCase().includes(q)) ||
        a.status.toLowerCase().includes(q)
    );
  }, [recentActivity, searchQuery]);

  const handleToolToggle = (tool) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSelectAll = () => setSelectedTools([...availableTools]);
  const handleClearAll = () => setSelectedTools([]);

  const handleStartScan = async () => {
    setError('');
    if (!target.trim()) { setError('Please enter a target'); return; }
    if (selectedTools.length === 0) { setError('Please select at least one tool'); return; }
    try {
      setScanning(true);
      const response = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target.trim(), target_type: targetType, tools: selectedTools }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Failed to start scan'); setScanning(false); return; }
      setScanId(data.scan_id);
      setScanStatus({ id: data.scan_id, status: 'pending', progress: 0, results: {} });
    } catch (err) {
      setError('Error starting scan: ' + err.message);
      setScanning(false);
    }
  };


  const handleExport = async (format) => {
    if (!scanId) return;
    try {
      const response = await fetch(`${API_BASE}/scan/${scanId}/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recon_${target}_${scanId}.${format === 'json' ? 'json' : 'md'}`;
      a.click();
    } catch (err) {
      setError('Failed to export results');
    }
  };

  const handleNewScan = () => {
    setTarget('');
    setTargetType('Domain/IP');
    setSelectedTools([]);
    setScanId(null);
    setScanStatus(null);
    setScanning(false);
    setError('');
    setActiveNav('Dashboard');
    setSidebarOpen(false);
  };

  const renderDashboard = () => (
    <>
      <div className="scan-input-card">
        <h2>Initialize New Recon Operation</h2>
        <div className="scan-input-row">
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="scan-input scan-type-select"
            disabled={scanning}
          >
            <option value="Domain/IP">Domain / IP</option>
            <option value="Username">Username</option>
            <option value="Email">Email</option>
          </select>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={
              targetType === 'Domain/IP'
                ? 'Enter target domain or IP (e.g., example.com, 192.168.1.1)'
                : targetType === 'Username'
                ? 'Enter username (e.g., john_doe)'
                : 'Enter email or domain (e.g., user@example.com)'
            }
            className="scan-input"
            disabled={scanning}
          />
          <button className="execute-btn" onClick={handleStartScan} disabled={scanning}>
            {scanning ? 'SCANNING...' : '▶ EXECUTE SCAN'}
          </button>
        </div>
        {error && <div className="error-msg">{error}</div>}
      </div>

      <div className="module-config">
        <div className="module-header">
          <div>
            <h2>Module Configuration</h2>
            <p className="module-subtitle">Select the reconnaissance vectors for this operation.</p>
          </div>
          <div className="module-actions">
            <button className="action-btn select-all" onClick={handleSelectAll}>Select ALL</button>
            <button className="action-btn" onClick={handleClearAll}>Clear</button>
          </div>
        </div>
        <div className={`tools-grid ${settings.compactMode ? 'compact' : ''}`}>
          {availableTools.map((tool) => (
            <div
              key={tool}
              className={`tool-card ${selectedTools.includes(tool) ? 'selected' : ''}`}
              onClick={() => handleToolToggle(tool)}
            >
              <div className="tool-card-header">
                <span className="tool-icon">{TOOL_ICONS[tool] || '⊕'}</span>
                <span className={`tool-tag ${TOOL_TAGS[tool]?.toLowerCase()}`}>{TOOL_TAGS[tool]}</span>
                <span className={`status-dot ${selectedTools.includes(tool) ? 'active' : ''}`} />
              </div>
              <h3 className="tool-card-name">{tool}</h3>
              {settings.showToolDesc && (
                <p className="tool-card-desc">{TOOL_DESCRIPTIONS[tool] || 'Reconnaissance tool.'}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {scanStatus && (
        <div className="results-panel">
          <h2>Scan Results</h2>
          <div className="progress-section">
            <div className="progress-header">
              <span>Progress</span>
              <span className="progress-percent">{scanStatus.progress}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${scanStatus.progress}%` }} />
            </div>
            <p className="status-text">Status: <strong>{scanStatus.status}</strong></p>
          </div>
          <div className="results-section">
            <p className="results-hint">
              {scanStatus.status === 'completed'
                ? 'Tap any tool below to expand results'
                : 'Waiting for results...'}
            </p>
            {Object.entries(scanStatus.results).map(([tool, result]) => (
              <details key={tool} className="result-item">
                <summary className="result-title">
                  <span className="result-title-left">
                    <span className="result-chevron">▸</span>
                    <span>{tool}</span>
                  </span>
                  <span className={`result-status ${result?.returncode === 0 ? 'success' : 'warning'}`}>
                    {result?.returncode === 0 ? '✓ Complete' : result?.error ? '✕ Error' : '⚠ Check'}
                  </span>
                </summary>
                <div className="result-content">
                  {result?.stdout && result.stdout.trim() ? (
                    <pre className="result-output">{result.stdout}</pre>
                  ) : (
                    <p className="result-empty">No output returned from this tool.</p>
                  )}
                  {result?.error && <p className="result-error">Error: {result.error}</p>}
                  {result?.stderr && result?.returncode !== 0 && !result?.error && (
                    <p className="result-error">{result.stderr}</p>
                  )}
                </div>
              </details>
            ))}
          </div>
          {scanStatus.status === 'completed' && (
            <div className="export-section">
              <button onClick={() => handleExport(settings.exportFormat)} className="btn btn-secondary">
                Download {settings.exportFormat === 'json' ? 'JSON' : 'Markdown'}
              </button>
              <button onClick={() => handleExport(settings.exportFormat === 'json' ? 'markdown' : 'json')} className="btn btn-secondary">
                Download {settings.exportFormat === 'json' ? 'Markdown' : 'JSON'}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  const renderActiveScans = () => (
    <div className="placeholder-page">
      <h2>Active Scans</h2>
      <p className="placeholder-text">
        {scanning
          ? `Scan in progress... ${scanStatus?.progress || 0}% complete`
          : 'No active scans running.'}
      </p>
      {scanning && scanStatus && (
        <div className="progress-bar" style={{ maxWidth: 400 }}>
          <div className="progress-fill" style={{ width: `${scanStatus.progress}%` }} />
        </div>
      )}
    </div>
  );

  const renderScanHistory = () => (
    <div className="placeholder-page">
      <h2>Scan History</h2>
      {recentActivity.length === 0 ? (
        <p className="placeholder-text">No scan history yet. Start a scan from the Dashboard.</p>
      ) : (
        <div className="history-list">
          {filteredActivity.map((a, i) => (
            <div key={i} className={`history-item ${a.status}`}>
              <span className={`history-status-dot ${a.status}`} />
              <div className="history-info">
                <span className="history-target">{a.target}</span>
                <span className="history-meta">{a.time} — {a.tools.length} tools — {a.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeNav) {
      case 'Active Scans': return renderActiveScans();
      case 'Scan History': return renderScanHistory();
      case 'Settings': return <SettingsPanel settings={settings} onUpdate={setSettings} updateCursorTheme={updateCursorTheme} currentTheme={currentTheme} />;
      default: return renderDashboard();
    }
  };

  return (
    <div className="recon-app">
      {/* SIDEBAR OVERLAY (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Icon name="ghost" size={24} className="brand-ghost" />
          Recon_Set.
        </div>

        <nav className="sidebar-nav">
          {[
            { name: 'Dashboard', icon: 'dashboard' },
            { name: 'Active Scans', icon: 'radar' },
            { name: 'Scan History', icon: 'history' },
            { name: 'Settings', icon: 'settings' },
          ].map((item) => (
            <button
              key={item.name}
              className={`nav-item ${activeNav === item.name ? 'active' : ''}`}
              onClick={() => { setActiveNav(item.name); setSidebarOpen(false); }}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={18} />
              </span>
              {item.name}
            </button>
          ))}
        </nav>

        <button className="new-scan-btn" onClick={handleNewScan}>
          <Icon name="plus" size={16} />
          NEW SCAN
        </button>

        <div className="skull-decoration sidebar-skull">
          <div className="ghost-mascot">
            <SkullSVG />
          </div>
          <span className="skull-text">Recon_set</span>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? '✕' : '☰'}
            </button>
            <h1 className="topbar-title">Recon_Set._.</h1>
          </div>
          <div className="topbar-right">
            <div className={`search-bar ${searchExpanded ? 'expanded' : ''}`}>
              <span className="search-icon" onClick={() => {
                if (!searchExpanded) {
                  setSearchExpanded(true);
                  setTimeout(() => document.querySelector('.search-bar input')?.focus(), 300);
                } else {
                  setSearchExpanded(false);
                  setSearchQuery('');
                }
              }}>
                <Icon name="search" size={16} />
              </span>
              <input
                type="text"
                placeholder="Search scans, targets, tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => { setSearchQuery(''); setSearchExpanded(false); }}>
                  <Icon name="x" size={14} />
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="content-grid">
          <div className="center-panel">
            {renderContent()}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="right-sidebar">
            <div className="activity-panel">
              <div className="activity-header">
                <h2>Recent Activity</h2>
                {searchQuery && (
                  <span className="activity-count">{filteredActivity.length} results</span>
                )}
              </div>
              <div className="activity-list">
                {filteredActivity.length === 0 ? (
                  <div className="activity-empty">
                    {searchQuery ? 'No matching scans' : 'No recent scans'}
                  </div>
                ) : (
                  filteredActivity.map((activity, i) => (
                    <div key={i} className="activity-item">
                      <div className={`activity-status ${activity.status}`}>
                        {activity.status === 'completed' ? <Icon name="check" size={14} /> : activity.status === 'failed' ? <Icon name="x" size={14} /> : <Icon name="radar" size={14} />}
                      </div>
                      <div className="activity-info">
                        <span className="activity-target">{activity.target}</span>
                        <span className="activity-time">{activity.time}</span>
                        <span className="activity-desc">
                          {activity.status === 'completed'
                            ? 'Scan completed successfully.'
                            : activity.status === 'failed'
                            ? 'Operation failed.'
                            : `In Progress — ${activity.progress}% complete`}
                        </span>
                        <div className="activity-tags">
                          {activity.tools.slice(0, 3).map((t) => (
                            <span key={t} className="activity-tag">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* BOTTOM NAV (mobile) */}
      <nav className="bottom-nav">
        {[
          { name: 'Dashboard', icon: 'dashboard' },
          { name: 'Active Scans', icon: 'radar', label: 'Scans' },
          { name: 'Scan History', icon: 'history', label: 'History' },
        ].map((item) => (
          <button
            key={item.name}
            className={`bottom-nav-item ${activeNav === item.name ? 'active' : ''}`}
            onClick={() => setActiveNav(item.name)}
          >
            <span className="bottom-nav-icon">
              <Icon name={item.icon} size={20} />
            </span>
            {item.label || item.name}
          </button>
        ))}
      </nav>
    </div>
  );
}
