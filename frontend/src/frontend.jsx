import React, { useState, useEffect } from 'react';
import './frontend.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const TOOL_ICONS = {
  'WHOIS': '⊕',
  'DNS': '⊞',
  'DNS (Full)': '⊠',
  'Reverse DNS': '⇄',
  'TLS Certificate': '⊙',
  'HTTP Headers': '⊘',
  'Nmap Basic': '⊛',
  'Nmap Aggressive': '⚠',
  'DNS Zone Transfer': '⊕',
  'Sherlock': '⊕',
  'Subfinder': '◎',
  'theHarvester': '⚡',
  'WhatWeb': '◈',
  'WAFW00F': '◆',
  'Nikto': '◇',
  'Gobuster Dir': '▣',
  'Gobuster DNS': '▤',
  'FFUF': '▥',
  'HTTPx': '▦',
  'Masscan': '▧',
  'Maigret': '⊕',
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
  'WHOIS': 'OSINT',
  'DNS': 'DNS',
  'DNS (Full)': 'DNS',
  'Reverse DNS': 'DNS',
  'TLS Certificate': 'TLS',
  'HTTP Headers': 'HTTP',
  'Nmap Basic': 'NMAP',
  'Nmap Aggressive': 'NMAP-AGGRO',
  'DNS Zone Transfer': 'DNS',
  'Sherlock': 'OSINT',
  'Subfinder': 'DNS',
  'theHarvester': 'OSINT',
  'WhatWeb': 'HTTP',
  'WAFW00F': 'HTTP',
  'Nikto': 'HTTP',
  'Gobuster Dir': 'HTTP',
  'Gobuster DNS': 'DNS',
  'FFUF': 'HTTP',
  'HTTPx': 'HTTP',
  'Masscan': 'NMAP',
  'Maigret': 'OSINT',
};

const ASCII_LOGO = `
    ██████╗ ███████╗██████╗ ██████╗ ███████╗██████╗ 
    ██╔══██╗██╔════╝██╔══██╗██╔══██╗██╔════╝██╔══██╗
    ██████╔╝█████╗  ██║  ██║██████╔╝█████╗  ██████╔╝
    ██╔══██╗██╔══╝  ██║  ██║██╔══██╗██╔══╝  ██╔══██╗
    ██║  ██║███████╗██████╔╝██████╔╝███████╗██║  ██║
    ╚═╝  ╚═╝╚══════╝╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝`;

export default function ReconApp() {
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
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch(`${API_BASE}/tools?type=${encodeURIComponent(targetType)}`);
        const data = await response.json();
        setAvailableTools(data.tools);
        setSelectedTools([]);
      } catch (err) {
        setError('Failed to load tools');
      }
    };
    fetchTools();
  }, [targetType]);

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
            ...prev.slice(0, 4),
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch scan status:', err);
      }
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [scanId, scanning]);

  const handleToolToggle = (tool) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
  };

  const handleSelectAll = () => {
    setSelectedTools([...availableTools]);
  };

  const handleClearAll = () => {
    setSelectedTools([]);
  };

  const handleStartScan = async () => {
    setError('');
    if (!target.trim()) {
      setError('Please enter a target');
      return;
    }
    if (selectedTools.length === 0) {
      setError('Please select at least one tool');
      return;
    }
    try {
      setScanning(true);
      const response = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: target.trim(),
          target_type: targetType,
          tools: selectedTools,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Failed to start scan');
        setScanning(false);
        return;
      }
      setScanId(data.scan_id);
      setScanStatus({
        id: data.scan_id,
        status: 'pending',
        progress: 0,
        results: {},
      });
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

  return (
    <div className="recon-app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-profile">
          <div className="profile-avatar">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="#1a2332"/>
              <circle cx="20" cy="14" r="6" stroke="#00ff88" strokeWidth="1.5" fill="none"/>
              <path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#00ff88" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <div className="profile-info">
            <span className="profile-name">Vigilance AI</span>
            <span className="profile-role">Cyber Recon Ops</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {['Dashboard', 'Active Scans', 'Scan History', 'Settings'].map((item) => (
            <button
              key={item}
              className={`nav-item ${activeNav === item ? 'active' : ''}`}
              onClick={() => setActiveNav(item)}
            >
              <span className="nav-icon">
                {item === 'Dashboard' && '⊞'}
                {item === 'Active Scans' && '◎'}
                {item === 'Scan History' && '↻'}
                {item === 'Settings' && '⚙'}
              </span>
              {item}
            </button>
          ))}
        </nav>

        <button className="new-scan-btn" onClick={() => setActiveNav('Dashboard')}>
          + NEW SCAN
        </button>
      </aside>

      {/* MAIN AREA */}
      <div className="main-area">
        {/* TOP BAR */}
        <header className="topbar">
          <h1 className="topbar-title">Recon_Set._.</h1>
          <div className="topbar-right">
            <div className="search-bar">
              <span className="search-icon">⌕</span>
              <input type="text" placeholder="Search targets, scans..." />
            </div>
            <div className="topbar-icons">
              <button className="icon-btn">🔔</button>
              <button className="icon-btn">⚙</button>
              <button className="icon-btn">👤</button>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="content-grid">
          {/* CENTER PANEL */}
          <div className="center-panel">
            {/* SCAN INPUT */}
            <div className="scan-input-card">
              <h2>Initialize New Recon Operation</h2>
              <div className="scan-input-row">
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="scan-input"
                  style={{ flex: '0 0 160px' }}
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
                <button
                  className="execute-btn"
                  onClick={handleStartScan}
                  disabled={scanning}
                >
                  {scanning ? 'SCANNING...' : '▶ EXECUTE SCAN'}
                </button>
              </div>
              {error && <div className="error-msg">{error}</div>}
            </div>

            {/* TOOL SELECTION */}
            <div className="module-config">
              <div className="module-header">
                <div>
                  <h2>Module Configuration</h2>
                  <p className="module-subtitle">Select the reconnaissance vectors for this operation.</p>
                </div>
                <div className="module-actions">
                  <button className="action-btn select-all" onClick={handleSelectAll}>Select ALL</button>
                  <button className="action-btn clear-btn" onClick={handleClearAll}>Clear</button>
                </div>
              </div>

              <div className="tools-grid">
                {availableTools.map((tool) => (
                  <div
                    key={tool}
                    className={`tool-card ${selectedTools.includes(tool) ? 'selected' : ''}`}
                    onClick={() => handleToolToggle(tool)}
                  >
                    <div className="tool-card-header">
                      <span className="tool-icon">{TOOL_ICONS[tool] || '⊕'}</span>
                      <span className={`tool-tag ${TOOL_TAGS[tool]?.toLowerCase()}`}>
                        {TOOL_TAGS[tool]}
                      </span>
                      <span className={`status-dot ${selectedTools.includes(tool) ? 'active' : ''}`} />
                    </div>
                    <h3 className="tool-card-name">{tool}</h3>
                    <p className="tool-card-desc">{TOOL_DESCRIPTIONS[tool] || 'Reconnaissance tool.'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SCAN RESULTS */}
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
                  {Object.entries(scanStatus.results).map(([tool, result]) => (
                    <details key={tool} className="result-item">
                      <summary className="result-title">
                        <span className="tool-name">{tool}</span>
                        <span className={`result-status ${result?.returncode === 0 ? 'success' : 'warning'}`}>
                          {result?.returncode === 0 ? '✓' : '⚠'}
                        </span>
                      </summary>
                      <div className="result-content">
                        {result?.stdout && (
                          <pre className="result-output">{result.stdout}</pre>
                        )}
                        {result?.error && <p className="result-error">Error: {result.error}</p>}
                        {result?.stderr && result?.returncode !== 0 && (
                          <p className="result-error">{result.stderr}</p>
                        )}
                      </div>
                    </details>
                  ))}
                </div>

                {scanStatus.status === 'completed' && (
                  <div className="export-section">
                    <button onClick={() => handleExport('markdown')} className="btn btn-secondary">
                      Download Markdown
                    </button>
                    <button onClick={() => handleExport('json')} className="btn btn-secondary">
                      Download JSON
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="right-sidebar">
            <div className="activity-panel">
              <div className="activity-header">
                <h2>Recent Activity</h2>
                <button className="dots-menu">•••</button>
              </div>

              <div className="activity-list">
                {recentActivity.length === 0 ? (
                  <div className="activity-empty">No recent scans</div>
                ) : (
                  recentActivity.map((activity, i) => (
                    <div key={i} className="activity-item">
                      <div className={`activity-status ${activity.status}`}>
                        {activity.status === 'completed' ? '✓' : activity.status === 'failed' ? '✕' : '◎'}
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

            <div className="ascii-logo">
              <pre>{ASCII_LOGO}</pre>
            </div>

            <button className="view-logs-btn">VIEW FULL LOGS</button>
          </aside>
        </div>
      </div>
    </div>
  );
}
