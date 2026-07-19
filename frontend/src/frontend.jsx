import React, { useState, useEffect, useMemo } from 'react';
import './frontend.css';
import { useCursorTheme } from './hooks/useCursorTheme';
import { ThemeSwitcher } from './components/ThemeSwitcher';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const DEFAULT_SETTINGS = {
  theme: 'phantom',
  exportFormat: 'markdown',
  autoSelectAll: false,
  showToolDesc: true,
  compactMode: false,
};

const TOOL_ICONS = {
  'WHOIS': 'globe', 'DNS': 'server', 'DNS (Full)': 'network', 'Reverse DNS': 'rotate-ccw',
  'TLS Certificate': 'shield-check', 'HTTP Headers': 'eye', 'Nmap Basic': 'scan',
  'Nmap Aggressive': 'crosshair', 'Nmap Vuln Scripts': 'shield-alert', 'DNS Zone Transfer': 'file-search',
  'Sherlock': 'user-search', 'Subfinder': 'radar', 'theHarvester': 'mail-search', 'WhatWeb': 'code',
  'WAFW00F': 'shield', 'Nikto': 'bug', 'Gobuster Dir': 'folder-search', 'Gobuster DNS': 'radar',
  'FFUF': 'zap', 'HTTPx': 'terminal', 'Masscan': 'zap', 'Maigret': 'file-search', 'Holehe': 'mail-search',
  'SSL Scan': 'lock', 'Nuclei': 'crosshair', 'CORS Test': 'globe', 'Security Headers': 'shield-check',
  'Technology Stack': 'code', 'Port Scan Full': 'radar', 'Subdomain Takeover': 'shield-alert',
};

const SCAN_PROFILES = {
  quick: { name: 'Quick Scan', icon: 'zap', color: '#00ff88', description: '~2 min', tools: ['WHOIS', 'DNS', 'HTTP Headers', 'Nmap Basic', 'WhatWeb'] },
  standard: { name: 'Standard Scan', icon: 'search', color: '#00d4ff', description: '~5 min', tools: ['WHOIS', 'DNS', 'DNS (Full)', 'TLS Certificate', 'HTTP Headers', 'Nmap Basic', 'WhatWeb', 'WAFW00F', 'Subfinder', 'HTTPx'] },
  deep: { name: 'Deep Scan', icon: 'radar', color: '#ff6b6b', description: '~15 min', tools: ['WHOIS', 'DNS', 'DNS (Full)', 'Reverse DNS', 'TLS Certificate', 'HTTP Headers', 'Nmap Basic', 'Nmap Aggressive', 'DNS Zone Transfer', 'Subfinder', 'WhatWeb', 'WAFW00F', 'Nikto', 'Gobuster Dir', 'Gobuster DNS', 'FFUF', 'HTTPx', 'Masscan'] },
  vuln: { name: 'Vulnerability', icon: 'shield-alert', color: '#ffd93d', description: '~10 min', tools: ['Nmap Aggressive', 'Nikto', 'WhatWeb', 'WAFW00F', 'SSL Scan', 'Nmap Vuln Scripts'] },
  osint: { name: 'OSINT', icon: 'user-search', color: '#c084fc', description: '~5 min', tools: ['WHOIS', 'DNS', 'Subfinder', 'theHarvester', 'Sherlock', 'Maigret', 'Holehe'] },
  web: { name: 'Web App', icon: 'globe', color: '#22d3ee', description: '~8 min', tools: ['HTTP Headers', 'TLS Certificate', 'WhatWeb', 'WAFW00F', 'Nikto', 'Gobuster Dir', 'FFUF', 'HTTPx'] },
};

// SVG Icon Components (Lucide Icons - ISC License)
const Icon = ({ name, size = 18, className = '' }) => {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="7" height="9" x="3" y="3" rx="1"/>
        <rect width="7" height="5" x="14" y="3" rx="1"/>
        <rect width="7" height="9" x="14" y="12" rx="1"/>
        <rect width="7" height="5" x="3" y="16" rx="1"/>
      </svg>
    ),
    radar: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/>
        <path d="M4 6h.01"/>
        <path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/>
        <path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/>
        <path d="M12 18h.01"/>
        <path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/>
        <circle cx="12" cy="12" r="2"/>
        <path d="m13.41 10.59 5.66-5.66"/>
      </svg>
    ),
    history: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M12 7v5l4 2"/>
      </svg>
    ),
    settings: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m21 21-4.34-4.34"/>
        <circle cx="11" cy="11" r="8"/>
      </svg>
    ),
    plus: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 12h14"/>
        <path d="M12 5v14"/>
      </svg>
    ),
    check: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    ),
    x: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </svg>
    ),
    warning: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/>
        <path d="M12 9v4"/>
        <path d="M12 17h.01"/>
      </svg>
    ),
    chevron: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m9 18 6-6-6-6"/>
      </svg>
    ),
    download: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 15V3"/>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <path d="m7 10 5 5 5-5"/>
      </svg>
    ),
    scan: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
        <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
        <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
        <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
      </svg>
    ),
    ghost: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 10h.01"/>
        <path d="M15 10h.01"/>
        <path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
      </svg>
    ),
    port: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
        <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
        <line x1="6" x2="6.01" y1="6" y2="6"/>
        <line x1="6" x2="6.01" y1="18" y2="18"/>
      </svg>
    ),
    globe: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
        <path d="M2 12h20"/>
      </svg>
    ),
    shield: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
      </svg>
    ),
    'shield-check': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    'shield-alert': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
        <path d="M12 8v4"/>
        <path d="M12 16h.01"/>
      </svg>
    ),
    user: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    'user-search': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="10" cy="7" r="4"/>
        <path d="M10.3 15H7a4 4 0 0 0-4 4v2"/>
        <circle cx="17" cy="17" r="3"/>
        <path d="m21 21-1.9-1.9"/>
      </svg>
    ),
    mail: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
        <rect x="2" y="4" width="20" height="16" rx="2"/>
      </svg>
    ),
    'mail-search': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 12.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h7.5"/>
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        <path d="M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
        <circle cx="18" cy="18" r="3"/>
        <path d="m22 22-1.5-1.5"/>
      </svg>
    ),
    zap: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>
      </svg>
    ),
    lock: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    bug: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 20v-9"/>
        <path d="M14 7a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4z"/>
        <path d="M14.12 3.88 16 2"/>
        <path d="M21 21a4 4 0 0 0-3.81-4"/>
        <path d="M21 5a4 4 0 0 1-3.55 3.97"/>
        <path d="M22 13h-4"/>
        <path d="M3 21a4 4 0 0 1 3.81-4"/>
        <path d="M3 5a4 4 0 0 0 3.55 3.97"/>
        <path d="M6 13H2"/>
        <path d="m8 2 1.88 1.88"/>
        <path d="M9 7.13V6a3 3 0 1 1 6 0v1.13"/>
      </svg>
    ),
    crosshair: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="22" x2="18" y1="12" y2="12"/>
        <line x1="6" x2="2" y1="12" y2="12"/>
        <line x1="12" x2="12" y1="6" y2="2"/>
        <line x1="12" x2="12" y1="22" y2="18"/>
      </svg>
    ),
    target: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="6"/>
        <circle cx="12" cy="12" r="2"/>
      </svg>
    ),
    eye: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    code: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m16 18 6-6-6-6"/>
        <path d="m8 6-6 6 6 6"/>
      </svg>
    ),
    terminal: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 19h8"/>
        <path d="m4 17 6-6-6-6"/>
      </svg>
    ),
    'folder-search': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M10.7 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4.1"/>
        <path d="m21 21-1.9-1.9"/>
        <circle cx="17" cy="17" r="3"/>
      </svg>
    ),
    'file-search': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/>
        <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
        <circle cx="11.5" cy="14.5" r="2.5"/>
        <path d="M13.3 16.3 15 18"/>
      </svg>
    ),
    network: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="16" y="16" width="6" height="6" rx="1"/>
        <rect x="2" y="16" width="6" height="6" rx="1"/>
        <rect x="9" y="2" width="6" height="6" rx="1"/>
        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/>
        <path d="M12 12V8"/>
      </svg>
    ),
    server: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
        <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
        <line x1="6" x2="6.01" y1="6" y2="6"/>
        <line x1="6" x2="6.01" y1="18" y2="18"/>
      </svg>
    ),
    'rotate-ccw': (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
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
  'Nmap Vuln Scripts': 'Run Nmap vulnerability detection scripts (vuln category).',
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
  'Holehe': 'Check if email is registered on 100+ websites.',
  'SSL Scan': 'SSL/TLS cipher suites and certificate chain analysis.',
  'Nuclei': 'Template-based vulnerability scanner with community templates.',
  'CORS Test': 'Test for misconfigured Cross-Origin Resource Sharing policies.',
  'Security Headers': 'Check for missing security headers (HSTS, CSP, etc).',
  'Technology Stack': 'Deep technology fingerprinting and version detection.',
  'Port Scan Full': 'Full 65535 port scan for comprehensive coverage.',
  'Subdomain Takeover': 'Detect subdomains vulnerable to takeover attacks.',
};

const TOOL_TAGS = {
  'WHOIS': 'OSINT', 'DNS': 'DNS', 'DNS (Full)': 'DNS', 'Reverse DNS': 'DNS',
  'TLS Certificate': 'TLS', 'HTTP Headers': 'HTTP', 'Nmap Basic': 'NMAP',
  'Nmap Aggressive': 'NMAP-AGGRO', 'Nmap Vuln Scripts': 'VULN', 'DNS Zone Transfer': 'DNS',
  'Sherlock': 'OSINT', 'Subfinder': 'DNS', 'theHarvester': 'OSINT', 'WhatWeb': 'HTTP',
  'WAFW00F': 'HTTP', 'Nikto': 'VULN', 'Gobuster Dir': 'BRUTE', 'Gobuster DNS': 'BRUTE',
  'FFUF': 'BRUTE', 'HTTPx': 'HTTP', 'Masscan': 'NMAP', 'Maigret': 'OSINT', 'Holehe': 'OSINT',
  'SSL Scan': 'TLS', 'Nuclei': 'VULN', 'CORS Test': 'VULN', 'Security Headers': 'HTTP',
  'Technology Stack': 'HTTP', 'Port Scan Full': 'NMAP', 'Subdomain Takeover': 'VULN',
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
            role="switch"
            aria-checked={settings.compactMode}
            aria-label="Compact Mode"
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
            role="switch"
            aria-checked={settings.autoSelectAll}
            aria-label="Auto-select All Tools"
            onClick={() => onUpdate({ ...settings, autoSelectAll: !settings.autoSelectAll })}
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>
        <div className="settings-row">
          <label className="settings-label">Show Tool Descriptions</label>
          <button
            className={`settings-toggle ${settings.showToolDesc ? 'on' : ''}`}
            role="switch"
            aria-checked={settings.showToolDesc}
            aria-label="Show Tool Descriptions"
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

function getRelativeTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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
  const [recentActivity, setRecentActivity] = useState(() => {
    try {
      const saved = localStorage.getItem('recon-activity');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [parallelMode, setParallelMode] = useState(false);
  const [toolCategories, setToolCategories] = useState({});
  const [scanCompleteNotif, setScanCompleteNotif] = useState(false);
  const [toolsLoading, setToolsLoading] = useState(false);

  const { currentTheme, updateCursorTheme } = useCursorTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    updateCursorTheme(settings.theme);
    localStorage.setItem('recon-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('recon-activity', JSON.stringify(recentActivity));
  }, [recentActivity]);

  useEffect(() => {
    const cursor = document.getElementById('custom-cursor');
    if (!cursor) return;
    let ticking = false;
    const move = (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          cursor.style.left = e.clientX - 20 + 'px';
          cursor.style.top = e.clientY - 20 + 'px';
          ticking = false;
        });
        ticking = true;
      }
    };
    const over = () => { cursor.style.transform = 'scale(1.8)'; };
    const out = () => { cursor.style.transform = 'scale(1)'; };
    document.addEventListener('mousemove', move);
    const elements = document.querySelectorAll('.tool-card, .nav-item, .execute-btn, .new-scan-btn, .activity-item');
    elements.forEach(el => {
      el.addEventListener('mouseenter', over);
      el.addEventListener('mouseleave', out);
    });
    return () => {
      document.removeEventListener('mousemove', move);
      elements.forEach(el => {
        el.removeEventListener('mouseenter', over);
        el.removeEventListener('mouseleave', out);
      });
    };
  }, []);

  useEffect(() => {
    const fetchTools = async () => {
      setToolsLoading(true);
      try {
        const response = await fetch(`${API_BASE}/tools?type=${encodeURIComponent(targetType)}`);
        if (!response.ok) {
          setError('Failed to load tools from server');
          setAvailableTools([]);
          setToolsLoading(false);
          return;
        }
        const data = await response.json();
        setAvailableTools(data.tools || []);
        setToolCategories(data.categories || {});
        if (settings.autoSelectAll) {
          setSelectedTools([...(data.tools || [])]);
        } else {
          setSelectedTools([]);
        }
      } catch (err) {
        setError('Failed to connect to server');
        setAvailableTools([]);
      } finally {
        setToolsLoading(false);
      }
    };
    fetchTools();
  }, [targetType, settings.autoSelectAll]);

  useEffect(() => {
    if (!scanId || !scanning) return;
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/${scanId}`);
        if (!response.ok) {
          console.error('Scan status fetch failed:', response.status);
          return;
        }
        const data = await response.json();
        if (data && data.status) {
          setScanStatus(data);
          if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            setScanning(false);
            if (data.status === 'completed') {
              setScanCompleteNotif(true);
              setTimeout(() => setScanCompleteNotif(false), 5000);
            }
            setRecentActivity((prev) => [
              {
                id: scanId,
                target: target,
                status: data.status,
                tools: [...selectedTools],
                time: new Date().toLocaleTimeString(),
                progress: data.progress,
                timestamp: Date.now(),
              },
              ...prev.slice(0, 19),
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch scan status:', err);
      }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [scanId, scanning, target]);

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
    setSelectedTools((prev) => {
      const next = prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool];
      return next;
    });
    setSelectedProfile(null);
  };

  const handleSelectAll = () => { setSelectedTools([...availableTools]); setSelectedProfile(null); };
  const handleClearAll = () => { setSelectedTools([]); setSelectedProfile(null); };

  const handleProfileSelect = (profileKey) => {
    if (selectedProfile === profileKey) {
      setSelectedProfile(null);
      setSelectedTools([]);
    } else {
      setSelectedProfile(profileKey);
      setSelectedTools([...SCAN_PROFILES[profileKey].tools]);
      setActiveCategory('All');
    }
  };

  const handleStartScan = async () => {
    setError('');
    if (!target.trim()) { setError('Please enter a target'); return; }
    if (selectedTools.length === 0 && !selectedProfile) { setError('Please select at least one tool or profile'); return; }
    try {
      setScanning(true);
      const response = await fetch(`${API_BASE}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: target.trim(),
          target_type: targetType,
          tools: selectedTools,
          profile: selectedProfile,
          parallel: parallelMode
        }),
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
      if (!response.ok) {
        setError('Export failed: ' + (response.statusText || 'Server error'));
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recon_${target}_${scanId}.${format === 'json' ? 'json' : 'md'}`;
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError('Failed to export results');
    }
  };

  const handleNewScan = async () => {
    if (scanning && scanId) {
      try {
        await fetch(`${API_BASE}/scan/${scanId}/cancel`, { method: 'POST' });
      } catch (e) { /* ignore */ }
    }
    setTarget('');
    setTargetType('Domain/IP');
    setSelectedTools([]);
    setScanId(null);
    setScanStatus(null);
    setScanning(false);
    setError('');
    setActiveNav('Dashboard');
    setSidebarOpen(false);
    setSelectedProfile(null);
    setActiveCategory('All');
    setParallelMode(false);
  };

  const handleCancelScan = async () => {
    if (scanId) {
      try {
        await fetch(`${API_BASE}/scan/${scanId}/cancel`, { method: 'POST' });
      } catch (e) { /* ignore */ }
    }
    setScanning(false);
    setScanStatus(null);
    setScanId(null);
  };

  const filteredTools = useMemo(() => {
    if (activeCategory === 'All') return availableTools;
    return availableTools.filter(tool => toolCategories[activeCategory]?.includes(tool));
  }, [availableTools, activeCategory, toolCategories]);

  const renderDashboard = () => (
    <>
      <div className="scan-input-card">
        <h2>Initialize New Recon Operation</h2>
        <div className="scan-input-row">
          <select
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value); setSelectedProfile(null); }}
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
                ? 'Enter target domain or IP (e.g., example.com, 127.0.0.1)'
                : targetType === 'Username'
                ? 'Enter username (e.g., john_doe)'
                : 'Enter email or domain (e.g., user@example.com)'
            }
            className="scan-input"
            disabled={scanning}
          />
          {scanning ? (
            <button className="execute-btn cancel-btn" onClick={handleCancelScan}>
              ✕ CANCEL
            </button>
          ) : (
            <button className="execute-btn" onClick={handleStartScan}>
              ▶ EXECUTE SCAN
            </button>
          )}
        </div>
        {error && <div className="error-msg" role="alert">{error}</div>}
        {scanCompleteNotif && (
          <div className="scan-notif success" role="status">
            ✓ Scan completed successfully! Scroll down for results.
          </div>
        )}

        <div className="scan-options-row">
          <label className="scan-option">
            <input
              type="checkbox"
              checked={parallelMode}
              onChange={(e) => setParallelMode(e.target.checked)}
              disabled={scanning}
            />
            <span>Parallel Execution</span>
          </label>
          {selectedProfile && (
            <span className="profile-badge">
              Profile: {SCAN_PROFILES[selectedProfile]?.name}
              <button className="profile-badge-clear" onClick={() => { setSelectedProfile(null); setSelectedTools([]); }} aria-label="Clear profile">✕</button>
            </span>
          )}
          {selectedTools.length > 0 && (
            <span className="tool-count-badge">{selectedTools.length} tools selected</span>
          )}
        </div>
      </div>

      {targetType === 'Domain/IP' && (
        <div className="profiles-section">
          <h2>Scan Profiles</h2>
          <p className="profiles-subtitle">Quick presets for common reconnaissance tasks</p>
          <div className="profiles-grid">
            {Object.entries(SCAN_PROFILES).map(([key, profile]) => (
              <button
                key={key}
                className={`profile-card ${selectedProfile === key ? 'selected' : ''}`}
                onClick={() => handleProfileSelect(key)}
                disabled={scanning}
                style={{ '--profile-color': profile.color }}
              >
                <span className="profile-icon"><Icon name={profile.icon} size={20} /></span>
                <span className="profile-name">{profile.name}</span>
                <span className="profile-desc">{profile.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="module-config">
        <div className="module-header">
          <div>
            <h2>Module Configuration</h2>
            <p className="module-subtitle">
              {selectedProfile
                ? `Using ${SCAN_PROFILES[selectedProfile]?.name} profile — or customize below`
                : 'Select the reconnaissance vectors for this operation'}
              {selectedTools.length > 0 && !selectedProfile && (
                <span className="tool-count-badge"> {selectedTools.length} of {availableTools.length} selected</span>
              )}
            </p>
          </div>
          <div className="module-actions">
            {!selectedProfile && (
              <>
                <button className="action-btn select-all" onClick={handleSelectAll}>Select ALL</button>
                <button className="action-btn" onClick={handleClearAll}>Clear</button>
              </>
            )}
          </div>
        </div>

        {Object.keys(toolCategories).length > 0 && targetType === 'Domain/IP' && (
          <div className="category-tabs">
            <button
              className={`category-tab ${activeCategory === 'All' ? 'active' : ''}`}
              onClick={() => setActiveCategory('All')}
            >
              All ({availableTools.length})
            </button>
            {Object.entries(toolCategories).map(([cat, tools]) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat} ({tools.length})
              </button>
            ))}
          </div>
        )}

        <div className={`tools-grid ${settings.compactMode ? 'compact' : ''}`}>
          {toolsLoading ? (
            <div className="tools-loading">
              <div className="spinner" />
              <span>Loading tools...</span>
            </div>
          ) : filteredTools.map((tool) => (
            <div
              key={tool}
              className={`tool-card ${selectedTools.includes(tool) ? 'selected' : ''} ${selectedProfile ? 'has-profile' : ''}`}
              onClick={() => handleToolToggle(tool)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToolToggle(tool); }}}
              role="button"
              tabIndex={0}
              aria-pressed={selectedTools.includes(tool)}
            >
              <div className="tool-card-header">
                <span className="tool-icon"><Icon name={TOOL_ICONS[tool] || 'globe'} size={16} /></span>
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
            {Object.keys(scanStatus.results).length === 0 && scanStatus.status === 'completed' && (
              <div className="result-empty-state">
                <p>No tools produced output. Try different tools or a different target.</p>
              </div>
            )}
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
          {scanStatus.status === 'failed' && (
            <div className="export-section">
              <button onClick={handleStartScan} className="btn btn-secondary retry-btn">
                ↻ Retry Scan
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
          {filteredActivity.map((a) => (
            <div key={a.id || a.timestamp} className={`history-item ${a.status}`}>
              <span className={`history-status-dot ${a.status}`} />
              <div className="history-info">
                <span className="history-target">{a.target}</span>
                <span className="history-meta">{getRelativeTime(a.timestamp)} — {a.tools.length} tools — {a.status}</span>
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
      <div className="custom-cursor" id="custom-cursor" />
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
              <span className="search-icon" role="button" tabIndex={0} aria-label="Toggle search" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); } }} onClick={() => {
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
              />
              {searchQuery && (
                <button className="search-clear" onMouseDown={(e) => { e.preventDefault(); setSearchQuery(''); setSearchExpanded(false); }}>
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
                  filteredActivity.map((activity) => (
                    <div key={activity.id || activity.timestamp} className="activity-item">
                      <div className={`activity-status ${activity.status}`}>
                        {activity.status === 'completed' ? <Icon name="check" size={14} /> : activity.status === 'failed' ? <Icon name="x" size={14} /> : <Icon name="radar" size={14} />}
                      </div>
                      <div className="activity-info">
                        <span className="activity-target">{activity.target}</span>
                        <span className="activity-time">{getRelativeTime(activity.timestamp)}</span>
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
                          {activity.tools.length > 3 && (
                            <span className="activity-tag activity-tag-more">+{activity.tools.length - 3}</span>
                          )}
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
          { name: 'Settings', icon: 'settings' },
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
