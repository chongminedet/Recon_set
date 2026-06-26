from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import subprocess
import threading
import json
import os
import uuid
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import logging

# ============================================================================
# FLASK APPLICATION SETUP
# ============================================================================

app = Flask(__name__)
CORS(app)

# Rate limiting configuration
# Use IP + endpoint path as key to separate limits per endpoint
def rate_limit_key():
    """Custom key function that includes request path"""
    return f"{get_remote_address()}:{request.endpoint}"

limiter = Limiter(
    app=app,
    key_func=rate_limit_key,
    default_limits=["10000 per day", "1000 per hour"],
    storage_uri="memory://"  # In-memory storage (single container)
)

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Storage directory for results
RESULTS_DIR = Path("recon_results")
RESULTS_DIR.mkdir(exist_ok=True)

# ============================================================================
# PRIVATE STATS AUTH
# ============================================================================

STATS_API_KEY = os.environ.get("STATS_API_KEY", "recon-admin-key-change-me")

def require_stats_auth(f):
    """Decorator to protect stats endpoints with API key"""
    from functools import wraps
    @wraps(f)
    def decorated(*args, **kwargs):
        key = request.headers.get("X-Stats-Key", "")
        if key != STATS_API_KEY:
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated

# ============================================================================
# VISITOR TRACKING DATABASE
# ============================================================================

VISITS_DB = Path("data/visits.db")

def init_visits_db():
    """Initialize the visits database"""
    try:
        VISITS_DB.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(VISITS_DB))
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            user_agent TEXT,
            timestamp TEXT,
            path TEXT,
            session_id TEXT
        )''')
        c.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON visits(timestamp)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_ip ON visits(ip)')
        c.execute('CREATE INDEX IF NOT EXISTS idx_session ON visits(session_id)')
        conn.commit()
        conn.close()
        logger.info("Visits database initialized")
    except Exception as e:
        logger.error(f"Failed to initialize visits database: {str(e)}")

def log_visit():
    """Log a visit to the database"""
    try:
        ip = request.remote_addr or 'unknown'
        ua = request.headers.get('User-Agent', '')
        ts = datetime.utcnow().isoformat()
        path = request.path
        # Use a session ID from cookie or generate one
        session_id = request.headers.get('X-Session-ID', '')
        if not session_id:
            session_id = f"{ip}:{ua[:50]}"

        conn = sqlite3.connect(str(VISITS_DB))
        c = conn.cursor()
        c.execute('INSERT INTO visits (ip, user_agent, timestamp, path, session_id) VALUES (?, ?, ?, ?, ?)',
                  (ip, ua, ts, path, session_id))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to log visit: {str(e)}")

# Initialize visits database on startup
init_visits_db()

@app.before_request
def before_request_handler():
    """Log every API request"""
    # Skip logging for static files and OPTIONS requests
    if request.method != 'OPTIONS' and request.path.startswith('/api/'):
        log_visit()

# ============================================================================
# SCAN MANAGER CLASS
# ============================================================================

class ScanManager:
    """Manages ongoing reconnaissance scans"""
    
    def __init__(self):
        self.scans = {}
        self._lock = threading.Lock()
    
    def create_scan(self, target, target_type, tools):
        """Create a new scan"""
        scan_id = str(uuid.uuid4())[:8]
        self.scans[scan_id] = {
            "id": scan_id,
            "target": target,
            "target_type": target_type,
            "tools": tools,
            "status": "pending",
            "progress": 0,
            "results": {},
            "started_at": datetime.now().isoformat(),
            "completed_at": None
        }
        return scan_id
    
    def get_scan(self, scan_id):
        """Get scan by ID"""
        return self.scans.get(scan_id)
    
    def update_progress(self, scan_id, tool, result):
        """Update scan progress with tool result"""
        with self._lock:
            if scan_id in self.scans:
                self.scans[scan_id]["results"][tool] = result
                completed = len([r for r in self.scans[scan_id]["results"].values() if r])
                total = len(self.scans[scan_id]["tools"])
                self.scans[scan_id]["progress"] = int((completed / total) * 100) if total > 0 else 0
    
    def mark_complete(self, scan_id):
        """Mark scan as completed"""
        with self._lock:
            if scan_id in self.scans:
                self.scans[scan_id]["status"] = "completed"
                self.scans[scan_id]["completed_at"] = datetime.now().isoformat()

# Initialize scan manager
scan_manager = ScanManager()

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def run_command(cmd, timeout=300):
    """Execute a system command safely with retry logic"""
    max_retries = 2
    for attempt in range(max_retries):
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            stdout = result.stdout[:10000] if result.stdout else ""
            stderr = result.stderr[:2000] if result.stderr else ""
            # If we got stdout, return it even if returncode is non-zero
            if stdout.strip():
                return {
                    "stdout": stdout,
                    "stderr": stderr,
                    "returncode": result.returncode
                }
            # No stdout — return whatever we have
            return {
                "stdout": stdout,
                "stderr": stderr,
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            if attempt < max_retries - 1:
                logger.warning(f"Command timeout (attempt {attempt+1}/{max_retries}), retrying...")
                timeout = min(int(timeout * 1.5), timeout + 120)  # Add 50% but cap at +120s
                continue
            logger.error(f"Command timed out after {max_retries} attempts")
            return {"error": f"Command timed out after {timeout}s", "timeout": True, "stdout": "", "stderr": "", "returncode": -1}
        except Exception as e:
            logger.error(f"Command execution failed: {str(e)}")
            return {"error": str(e), "failed": True, "stdout": "", "stderr": "", "returncode": -1}

def validate_target(target, target_type):
    """Validate target input to prevent command injection"""
    import re
    if not target or len(target) > 255:
        return False
    
    if target_type == "Domain/IP":
        # Allow alphanumeric, dots, hyphens, colons (IPv6), slashes (CIDR), @ for email
        return bool(re.match(r'^[a-zA-Z0-9.\-_:/@]+$', target))
    elif target_type == "Username":
        return bool(re.match(r'^[a-zA-Z0-9._-]+$', target))
    elif target_type == "Email":
        return bool(re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', target))
    return False

def execute_tool(tool, target):
    """Execute a specific reconnaissance tool"""
    commands = {
        "WHOIS": f"whois {target}",
        "DNS": f"dig {target} +short A; dig {target} +short MX; dig {target} +short NS; dig {target} +short TXT",
        "DNS (Full)": f"dig {target} A +noall +answer; dig {target} MX +noall +answer; dig {target} NS +noall +answer; dig {target} TXT +noall +answer",
        "Reverse DNS": f"dig -x {target} +short || echo 'No PTR record found for {target}'",
        "TLS Certificate": f"echo | timeout 10 openssl s_client -connect {target}:443 -servername {target} 2>/dev/null | openssl x509 -noout -text 2>/dev/null || echo 'Could not retrieve TLS certificate from {target}:443 — target may not have HTTPS'",
        "HTTP Headers": f"curl -I -sS --max-time 10 https://{target} 2>&1 || curl -I -sS --max-time 10 http://{target} 2>&1",
        "Nmap Basic": f"nmap -sV -Pn -p 1-1000 --max-rate 100 --open {target}",
        "Nmap Aggressive": f"nmap -sV -Pn -p 1-1000 --script default,vuln --max-rate 200 --open --host-timeout 300s {target}",
        "DNS Zone Transfer": f"echo 'Attempting zone transfer from {target}...' && dig @{target} axfr +noall +answer 2>&1 || echo 'Zone transfer failed — server does not allow AXFR (this is expected for most servers)'",
        "Sherlock": f"sherlock {target} --timeout 1 2>/dev/null",
        "Subfinder": f"subfinder -d {target} -silent",
        "theHarvester": f"cd /opt/theHarvester && python theHarvester/theHarvester.py -d {target} -b crtsh,bing,duckduckgo -l 200 2>&1",
        "Holehe": f"holehe {target}",
        "WhatWeb": f"whatweb {target} -a 3 --color=never",
        "WAFW00F": f"wafw00f {target}",
        "Nikto": f"nikto -h {target} -maxtime 180s",
        "Gobuster Dir": f"gobuster dir -u https://{target} -w /usr/share/wordlists/dirb/common.txt -q --no-error",
        "Gobuster DNS": f"gobuster dns -d {target} -w /usr/share/wordlists/dirb/common.txt -q --no-error -t 50",
        "FFUF": f"ffuf -u https://{target}/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,403 -s",
        "HTTPx": f"httpx -u {target} -silent -title -tech-detect -status-code",
        "Masscan": f"masscan {target} -p1-10000 --rate=1000 --open",
        "Maigret": f"maigret {target}",
    }
    
    if tool not in commands:
        return {"error": f"Unknown tool: {tool}"}
    
    logger.info(f"Executing {tool} against {target}")
    
    timeout_map = {
        "Nmap Aggressive": 900,
        "Nmap Basic": 600,
        "Nikto": 300,
        "Gobuster Dir": 300,
        "Gobuster DNS": 300,
        "FFUF": 300,
        "Masscan": 300,
        "theHarvester": 300,
        "Holehe": 120,
        "Maigret": 300,
        "HTTPx": 180,
        "TLS Certificate": 60,
        "DNS": 60,
        "DNS (Full)": 60,
        "DNS Zone Transfer": 120,
        "WHOIS": 60,
        "Reverse DNS": 60,
        "HTTP Headers": 30,
        "Sherlock": 300,
        "Subfinder": 180,
        "WhatWeb": 120,
        "WAFW00F": 120,
    }
    timeout = timeout_map.get(tool, 120)
    
    result = run_command(commands[tool], timeout=timeout)
    return result

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint - no rate limit"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    })

@app.route("/api/stats", methods=["GET"])
@limiter.limit("100 per hour")
@require_stats_auth
def get_stats():
    """Get visitor statistics"""
    try:
        conn = sqlite3.connect(str(VISITS_DB))
        c = conn.cursor()

        # Total API requests
        c.execute('SELECT COUNT(*) FROM visits')
        total_requests = c.fetchone()[0]

        # Unique IPs
        c.execute('SELECT COUNT(DISTINCT ip) FROM visits')
        unique_ips = c.fetchone()[0]

        # Unique sessions
        c.execute('SELECT COUNT(DISTINCT session_id) FROM visits')
        unique_sessions = c.fetchone()[0]

        # Today's requests
        today = datetime.utcnow().strftime('%Y-%m-%d')
        c.execute("SELECT COUNT(*) FROM visits WHERE timestamp LIKE ?", (f"{today}%",))
        today_requests = c.fetchone()[0]

        # Daily breakdown (last 30 days)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).strftime('%Y-%m-%d')
        c.execute("""
            SELECT DATE(timestamp) as day, COUNT(*) as requests, COUNT(DISTINCT ip) as unique_ips
            FROM visits
            WHERE timestamp >= ?
            GROUP BY day
            ORDER BY day DESC
        """, (thirty_days_ago,))
        daily = [{'date': row[0], 'requests': row[1], 'unique_ips': row[2]} for row in c.fetchall()]

        # Top endpoints
        c.execute("""
            SELECT path, COUNT(*) as count
            FROM visits
            GROUP BY path
            ORDER BY count DESC
            LIMIT 10
        """)
        top_endpoints = [{'path': row[0], 'count': row[1]} for row in c.fetchall()]

        # Active scanners (unique IPs that started a scan)
        c.execute("""
            SELECT COUNT(DISTINCT ip) FROM visits WHERE path = '/api/scan'
        """)
        active_scanners = c.fetchone()[0]

        # Scans initiated
        c.execute("SELECT COUNT(*) FROM visits WHERE path = '/api/scan' AND timestamp >= ?",
                  (thirty_days_ago,))
        scans_initiated = c.fetchone()[0]

        conn.close()

        return jsonify({
            'total_requests': total_requests,
            'unique_ips': unique_ips,
            'unique_sessions': unique_sessions,
            'today_requests': today_requests,
            'active_scanners': active_scanners,
            'scans_initiated': scans_initiated,
            'daily': daily,
            'top_endpoints': top_endpoints,
        })

    except Exception as e:
        logger.error(f"Failed to get stats: {str(e)}")
        return jsonify({'error': 'Failed to retrieve stats'}), 500

@app.route("/api/stats/scan", methods=["POST"])
@limiter.limit("100 per hour")
@require_stats_auth
def log_scan_event():
    """Log a scan event (called from frontend when scan starts)"""
    try:
        data = request.json or {}
        target_type = data.get('target_type', 'unknown')
        tools_count = len(data.get('tools', []))

        conn = sqlite3.connect(str(VISITS_DB))
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS scan_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            timestamp TEXT,
            target_type TEXT,
            tools_count INTEGER
        )''')
        c.execute('INSERT INTO scan_events (ip, timestamp, target_type, tools_count) VALUES (?, ?, ?, ?)',
                  (request.remote_addr, datetime.utcnow().isoformat(), target_type, tools_count))
        conn.commit()
        conn.close()

        return jsonify({'status': 'logged'})
    except Exception as e:
        logger.error(f"Failed to log scan event: {str(e)}")
        return jsonify({'error': 'Failed to log'}), 500

@app.route("/api/tools", methods=["GET"])
@limiter.limit("500 per hour")
def get_tools():
    """Get available tools based on target type"""
    target_type = request.args.get("type", "Domain/IP")
    
    tools_by_type = {
        "Domain/IP": [
            "WHOIS",
            "DNS",
            "DNS (Full)",
            "Reverse DNS",
            "TLS Certificate",
            "HTTP Headers",
            "Nmap Basic",
            "Nmap Aggressive",
            "DNS Zone Transfer",
            "Subfinder",
            "WhatWeb",
            "WAFW00F",
            "Nikto",
            "Gobuster Dir",
            "Gobuster DNS",
            "FFUF",
            "HTTPx",
            "Masscan"
        ],
        "Username": [
            "Sherlock",
            "Maigret"
        ],
        "Email": [
            "theHarvester",
            "Holehe"
        ]
    }
    
    return jsonify({
        "tools": tools_by_type.get(target_type, []),
        "descriptions": {
            "WHOIS": "Retrieve domain/IP registration details",
            "DNS": "Quick DNS lookup",
            "DNS (Full)": "Complete DNS records (A, MX, NS, TXT, etc.)",
            "Reverse DNS": "Reverse IP lookup",
            "TLS Certificate": "Extract SSL/TLS certificate information",
            "HTTP Headers": "Retrieve HTTP response headers",
            "Nmap Basic": "Basic network scanning with service detection",
            "Nmap Aggressive": "Aggressive Nmap scan with OS detection",
            "DNS Zone Transfer": "Attempt DNS zone transfer (AXFR)",
            "Sherlock": "Search usernames across social media platforms",
            "Subfinder": "Passive subdomain enumeration using multiple sources",
            "theHarvester": "Gather emails, subdomains, hosts from public sources",
            "WhatWeb": "Identify web technologies, CMS, frameworks",
            "WAFW00F": "Detect Web Application Firewalls",
            "Nikto": "Web server vulnerability scanner",
            "Gobuster Dir": "Directory and file brute-force enumeration",
            "Gobuster DNS": "Subdomain brute-force enumeration",
            "FFUF": "Fast web fuzzer for directory and parameter discovery",
            "HTTPx": "HTTP probing with title, tech detection, status codes",
            "Masscan": "High-speed port scanner (top 10000 ports)",
            "Maigret": "Advanced username OSINT across 3000+ sites",
            "Holehe": "Check if email is registered on 100+ websites"
        }
    })

@app.route("/api/scan", methods=["POST"])
@limiter.limit("500 per hour")  # Increased from 100 - allows ~8 scans per minute
def start_scan():
    """Start a new reconnaissance scan"""
    data = request.json
    target = data.get("target", "").strip()
    target_type = data.get("target_type", "Domain/IP")
    tools = data.get("tools", [])
    
    # Validation
    if not target or not validate_target(target, target_type):
        return jsonify({"error": "Invalid target"}), 400
    
    if not tools or len(tools) == 0:
        return jsonify({"error": "Select at least one tool"}), 400
    
    if len(tools) > 10:
        return jsonify({"error": "Maximum 10 tools per scan"}), 400
    
    # Create scan
    scan_id = scan_manager.create_scan(target, target_type, tools)
    
    # Start scan in background thread
    thread = threading.Thread(
        target=run_scan,
        args=(scan_id, target, tools),
        daemon=True
    )
    thread.start()
    
    return jsonify({
        "scan_id": scan_id,
        "status": "started",
        "message": f"Scan started for {target}"
    })

@app.route("/api/scan/<scan_id>", methods=["GET"])
@limiter.limit("5000 per hour")  # Increased for polling - allows frequent status checks
def get_scan_status(scan_id):
    """Get scan status and results"""
    scan = scan_manager.get_scan(scan_id)
    
    if not scan:
        return jsonify({"error": "Scan not found"}), 404
    
    return jsonify(scan)

@app.route("/api/scan/<scan_id>/cancel", methods=["POST"])
@limiter.limit("100 per hour")
def cancel_scan(scan_id):
    """Cancel a running scan"""
    scan = scan_manager.get_scan(scan_id)
    if not scan:
        return jsonify({"error": "Scan not found"}), 404
    if scan["status"] in ("completed", "failed"):
        return jsonify({"error": "Scan already finished"}), 400
    scan["status"] = "cancelled"
    scan["completed_at"] = datetime.now().isoformat()
    return jsonify({"status": "cancelled"})

@app.route("/api/scan/<scan_id>/export", methods=["GET"])
@limiter.limit("500 per hour")  # Reasonable limit for exports
def export_scan(scan_id):
    """Export scan results as Markdown or JSON"""
    scan = scan_manager.get_scan(scan_id)
    
    if not scan:
        return jsonify({"error": "Scan not found"}), 404
    
    format_type = request.args.get("format", "markdown")
    
    if format_type == "json":
        return jsonify(scan)
    
    # Generate Markdown report
    markdown = f"""# Reconnaissance Report

**Target:** {scan['target']}  
**Type:** {scan['target_type']}  
**Started:** {scan['started_at']}  
**Completed:** {scan['completed_at'] or 'In Progress'}  
**Status:** {scan['status']}  

---

## Results

"""
    
    for tool, result in scan['results'].items():
        markdown += f"\n### {tool}\n\n"
        if isinstance(result, dict):
            if result.get("stdout"):
                markdown += f"```\n{result['stdout']}\n```\n"
            if result.get("stderr") and result['returncode'] != 0:
                markdown += f"**Error:** {result['stderr']}\n"
        else:
            markdown += f"{result}\n"
    
    # Save to file
    filename = f"recon_{scan['target'].replace('/', '_')}_{scan['id']}.md"
    filepath = RESULTS_DIR / filename
    
    with open(filepath, "w") as f:
        f.write(markdown)
    
    return send_file(filepath, as_attachment=True, download_name=filename)

# ============================================================================
# BACKGROUND SCAN EXECUTION
# ============================================================================

def run_scan(scan_id, target, tools):
    """Execute scan in background thread"""
    try:
        scan = scan_manager.get_scan(scan_id)
        scan["status"] = "running"
        
        target_type = scan.get("target_type", "Domain/IP")
        
        # Extract domain and username from email for tools that need them
        domain_target = target
        username_target = target
        if target_type == "Email" and "@" in target:
            parts = target.split("@")
            username_target = parts[0]
            domain_target = parts[1]
        
        # Tools that need the username part of an email
        username_tools = {"Sherlock", "Maigret"}
        # Tools that need the full email address
        email_tools = {"Holehe"}
        
        for i, tool in enumerate(tools):
            if target_type == "Email" and tool in email_tools:
                result = execute_tool(tool, target)
            elif target_type == "Email" and tool in username_tools:
                result = execute_tool(tool, username_target)
            elif target_type == "Email":
                result = execute_tool(tool, domain_target)
            else:
                result = execute_tool(tool, target)
            scan_manager.update_progress(scan_id, tool, result)
            logger.info(f"[{scan_id}] Completed {tool} ({i+1}/{len(tools)})")
        
        scan_manager.mark_complete(scan_id)
        logger.info(f"[{scan_id}] Scan complete")
    
    except Exception as e:
        logger.error(f"[{scan_id}] Scan failed: {str(e)}")
        scan = scan_manager.get_scan(scan_id)
        if scan:
            scan["status"] = "failed"
            scan["error"] = str(e)

# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit errors"""
    return jsonify({"error": "Rate limit exceeded"}), 429

@app.errorhandler(404)
def not_found(e):
    """Handle not found errors"""
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(Exception)
def handle_error(e):
    """Handle all uncaught exceptions"""
    logger.error(f"Unhandled error: {str(e)}", exc_info=True)
    return jsonify({"error": "Internal server error", "details": str(e)}), 500

# ============================================================================
# SERVE FRONTEND
# ============================================================================

@app.route("/")
def index():
    """Root endpoint - return API info"""
    return jsonify({
        "name": "Recon-as-a-Service API",
        "version": "1.0",
        "endpoints": {
            "health": "GET /api/health",
            "tools": "GET /api/tools?type=Domain/IP",
            "scan": "POST /api/scan",
            "status": "GET /api/scan/<scan_id>",
            "export": "GET /api/scan/<scan_id>/export?format=json|markdown"
        }
    })

# ============================================================================
# HIDDEN ADMIN DASHBOARD
# ============================================================================

ADMIN_PATH = os.environ.get("ADMIN_PATH", "a8f3k2")

@app.route(f"/{ADMIN_PATH}", methods=["GET"])
def admin_dashboard():
    """Hidden admin dashboard - only accessible if you know the URL + key"""
    return '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Recon_Set - Admin</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0f1a;color:#e8eaed;font-family:'JetBrains Mono',monospace;padding:20px}
  h1{color:#00ff88;margin-bottom:8px;font-size:20px}
  .sub{color:#7a8ba8;font-size:12px;margin-bottom:20px}
  #login{max-width:350px;margin:80px auto;text-align:center}
  #login input{width:100%;padding:12px;background:#0c1420;border:1px solid #1a2a40;border-radius:8px;color:#e8eaed;font-size:14px;font-family:inherit;margin-bottom:10px;outline:none}
  #login input:focus{border-color:#00ff88}
  #login button{width:100%;padding:12px;background:#00ff88;color:#000;border:none;border-radius:8px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit}
  #login button:hover{box-shadow:0 0 20px rgba(0,255,136,0.3)}
  .error{color:#ff4757;font-size:12px;margin-top:8px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
  .card{background:#111c2e;border:1px solid #1a2a40;border-radius:8px;padding:16px;text-align:center}
  .card .val{font-size:24px;font-weight:700;color:#00ff88}
  .card .lbl{font-size:10px;color:#7a8ba8;text-transform:uppercase;letter-spacing:1px;margin-top:4px}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;color:#7a8ba8;padding:8px;border-bottom:1px solid #1a2a40;font-size:10px;text-transform:uppercase}
  td{padding:8px;border-bottom:1px solid #1a2a40}
  .bar{height:4px;background:#1a2a40;border-radius:2px;margin-top:4px}
  .bar-fill{height:100%;background:#00ff88;border-radius:2px;transition:width .3s}
  h2{font-size:14px;margin-bottom:12px;color:#e8eaed}
  #dashboard{display:none}
</style>
</head>
<body>
<div id="login">
  <h1>Recon_Set.</h1>
  <p class="sub">Admin Dashboard</p>
  <input type="password" id="key" placeholder="Admin key" autofocus>
  <button onclick="unlock()">ACCESS</button>
  <div class="error" id="err"></div>
</div>
<div id="dashboard">
  <h1>Recon_Set. — Admin Dashboard</h1>
  <p class="sub">Private analytics</p>
  <div class="grid" id="stats"></div>
  <h2>Daily Traffic (30 days)</h2>
  <div id="daily"></div>
  <h2 style="margin-top:20px">Top Endpoints</h2>
  <table id="endpoints"><thead><tr><th>Path</th><th>Requests</th></tr></thead><tbody></tbody></table>
</div>
<script>
let KEY='';
async function unlock(){
  KEY=document.getElementById('key').value;
  if(!KEY)return;
  try{
    const r=await fetch('/api/stats',{headers:{'X-Stats-Key':KEY}});
    if(r.status===401){document.getElementById('err').textContent='Invalid key';return}
    const d=await r.json();
    document.getElementById('login').style.display='none';
    document.getElementById('dashboard').style.display='block';
    document.getElementById('stats').innerHTML=[
      {v:d.total_requests,l:'Total Requests'},
      {v:d.unique_ips,l:'Unique Visitors'},
      {v:d.today_requests,l:'Today'},
      {v:d.scans_initiated,l:'Scans (30d)'},
      {v:d.active_scanners,l:'Active Scanners'},
      {v:d.unique_sessions,l:'Sessions'}
    ].map(s=>`<div class="card"><div class="val">${(s.v||0).toLocaleString()}</div><div class="lbl">${s.l}</div></div>`).join('');
    const maxR=Math.max(...d.daily.map(x=>x.requests),1);
    document.getElementById('daily').innerHTML=d.daily.slice(0,14).map(x=>`
      <div style="margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;font-size:11px;color:#7a8ba8">
          <span>${x.date}</span><span>${x.requests} req / ${x.unique_ips} ips</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${(x.requests/maxR*100)}%"></div>
      </div></div>`).join('');
    document.querySelector('#endpoints tbody').innerHTML=d.top_endpoints.map(x=>
      `<tr><td>${x.path}</td><td>${x.count}</td></tr>`
    ).join('');
  }catch(e){document.getElementById('err').textContent='Connection error'}
}
document.getElementById('key').addEventListener('keydown',e=>{if(e.key==='Enter')unlock()});
</script>
</body>
</html>'''

@app.route(f"/{ADMIN_PATH}/stats", methods=["GET"])
@require_stats_auth
def admin_stats_api():
    """Stats API for admin dashboard"""
    return get_stats()

# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting Recon-as-a-Service")
    app.run(debug=True, host="0.0.0.0", port=5000)
