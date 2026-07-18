# Recon_set Project Memory

## Overview
- **Repo**: https://github.com/chongminet/Recon_set.git (branch: main)
- **Stack**: Flask backend (app.py) + React frontend (frontend.jsx), Dockerized, deployed on EC2
- **Deploy**: `docker compose up -d --build` on EC2

## Architecture
- `backend/app.py` — Flask API, tool commands as subprocess dicts, tools_by_type, validate_target
- `backend/dockerfile` — installs system deps, Go binaries, Python OSINT tools, whatweb/nikto from git
- `backend/requirements.txt` — flask, flask-cors, flask-limiter, requests, gunicorn, werkzeug
- `frontend/src/frontend.jsx` — Main React component, all UI logic
- `frontend/src/frontend.css` — Full theme system (6 themes), all styles
- `frontend/package.json` — React 18 + react-scripts 5.0.1 (MUST exist or Docker build fails)
- `compose.yml` — 3 services (api:5000, frontend:3000, nginx:80)
- `nginx.conf` — Reverse proxy config
- `.gitignore` — excludes Screenshot*.png files

## Features Done
- **36 OSINT/recon tools**: WHOIS, DNS, DNS (Full), Reverse DNS, TLS Certificate, HTTP Headers, Nmap Basic, Nmap Aggressive, Nmap Vuln Scripts, DNS Zone Transfer, Sherlock, Subfinder, theHarvester, WhatWeb, WAFW00F, Nikto, Gobuster Dir, Gobuster DNS, FFUF, HTTPx, Masscan, Maigret, SSL Scan, Nuclei, CORS Test, Security Headers, Technology Stack, Port Scan Full, Subdomain Takeover, Holehe
- 3 target types: Domain/IP, Username, Email — each shows only their respective tools
- **6 Scan Profiles**: Quick (~2 min), Standard (~5 min), Deep (~15 min), Vulnerability (~10 min), OSINT (~5 min), Web App (~8 min)
- **Parallel Execution**: Toggle to run up to 5 tools simultaneously (3-5x faster)
- **Tool Categories**: Recon, Web, Vuln, Brute Force, OSINT, Nmap — filter by category
- **Scan Persistence**: All scans saved to SQLite, /api/scan/history endpoint
- 6 switchable themes (Phantom, Midnight, Ocean, Synthwave, Crimson, Light) via CSS data-theme
- Theme persistence via localStorage (recon-settings)
- Settings panel with: theme picker, scan timeout, export format, auto-select tools, show tool desc, compact mode
- Search bar filters activity feed and scan history
- Sidebar with diagonal scanlines, Recon_Set. brand, skull SVG decoration
- Scan History page, Active Scans page
- Mobile responsive with bottom nav
- CAPTCHA verification before each scan (math challenge)
- JetBrains Mono font across all themes
- Results dropdown with chevron icon and "tap to expand" hint
- New Scan button fully resets all state

## Fixes Applied (latest session)
- **validate_target** — switched from blacklist to whitelist regex (security fix)
- **DNS command** — changed `&&` to `;` so all record types run independently
- **DNS (Full)** — removed deprecated `ANY` record, fixed operator precedence
- **Gobuster DNS** — added `-t 50` thread limit (wordlist still needs update)
- **Masscan** — added `--open` flag to suppress closed/filtered ports
- **timeout_map** — added 5 missing tools: HTTP Headers (30s), Sherlock (300s), Subfinder (180s), WhatWeb (120s), WAFW00F (120s)
- **run_command retry** — capped timeout inflation at +120s max
- **ScanManager** — added threading.Lock for thread safety
- **Scan cancellation** — new endpoint POST /api/scan/<id>/cancel
- **Frontend polling** — fixed stale closure, 3s interval, added target/selectedTools to deps
- **fetchTools** — added response.ok check to prevent crash on server error
- **Search bar** — fixed onBlur issue, uses onMouseDown with preventDefault
- **Activity timestamps** — now uses getRelativeTime() for live updates
- **Empty results** — added fallback message when no tools produce output
- **Bottom nav** — added Settings link for mobile
- **Tool cards** — added keyboard accessibility (role, tabIndex, onKeyDown)
- **Activity keys** — uses scan ID instead of array index
- **Selected count** — shows "3 of 12 selected" badge
- **ThemeSwitcher** — active state uses each theme's own color (not hardcoded green)
- **Removed dead code** — deleted unused THEMES constant from frontend.jsx
- **Activity tags** — shows "+N more" when tools exceed 3

## Git History Notes
- Rebase was messy — two diverged branches from 17042cd with README.md conflict
- Screenshot files must NEVER be committed
- `frontend/package.json` must exist in repo

## Tool Binary Versions (in Docker)
- subfinder v2.14.0
- httpx v1.9.0
- ffuf v2.1.0
- gobuster v3.8.2
- nuclei v3.3.7
- whatweb — installed from git
- nikto — installed from git
- Go binaries extracted to /tmp/ then mv to /usr/local/bin/

## AWS EC2 Deployment
- Deploy command: `docker compose up -d --build`
- EC2 needs ports open: 80, 443 (and 5000 for direct API access if needed)
- Use Elastic IP for consistent public IP
- Consider AWS Certificate Manager for HTTPS
- Data persists on EC2 instance (visits.db, recon_results)

## User Preferences
- Full deploys over incremental fixes
- Wants things to match reference screenshots
- Prefers working features over code elegance
- Runs `docker compose up -d --build` to deploy
