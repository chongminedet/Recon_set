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
- 21 OSINT/recon tools: WHOIS, DNS, DNS (Full), Reverse DNS, TLS Certificate, HTTP Headers, Nmap Basic, Nmap Aggressive, DNS Zone Transfer, Sherlock, Subfinder, theHarvester, WhatWeb, WAFW00F, Nikto, Gobuster Dir, Gobuster DNS, FFUF, HTTPx, Masscan, Maigret
- 3 target types: Domain/IP, Username, Email — each shows only their respective tools
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

## Known Issues (as of last session)
- **TLS Certificate tool** — may be failing or returning empty
- **Nmap Aggressive** — stops at 10.2 sec, likely timeout too short for -A scan
- **DNS Zone Transfer** — not showing output (AXFR often fails against most servers, expected behavior but should show attempt)
- **DNS** — not showing anything (may need debugging)
- **New Scan button** — should reset/clear the page to fresh state (currently just navigates to Dashboard)
- **Finished scan results** — need clearer dropdown affordance so users know to click to expand

## Git History Notes
- Rebase was messy — two diverged branches from 17042cd with README.md conflict
- Screenshot files must NEVER be committed
- `frontend/package.json` must exist in repo

## Tool Binary Versions (in Docker)
- subfinder v2.14.0
- httpx v1.9.0
- ffuf v2.1.0
- gobuster v3.8.2
- whatweb — installed from git
- nikto — installed from git
- Go binaries extracted to /tmp/ then mv to /usr/local/bin/

## User Preferences
- Full deploys over incremental fixes
- Wants things to match reference screenshots
- Prefers working features over code elegance
- Runs `docker compose up -d --build` to deploy
