from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import subprocess
import threading
import json
import os
import uuid
from datetime import datetime
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
# SCAN MANAGER CLASS
# ============================================================================

class ScanManager:
    """Manages ongoing reconnaissance scans"""
    
    def __init__(self):
        self.scans = {}
    
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
        if scan_id in self.scans:
            self.scans[scan_id]["results"][tool] = result
            completed = len([r for r in self.scans[scan_id]["results"].values() if r])
            total = len(self.scans[scan_id]["tools"])
            self.scans[scan_id]["progress"] = int((completed / total) * 100) if total > 0 else 0
    
    def mark_complete(self, scan_id):
        """Mark scan as completed"""
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
    max_retries = 3
    for attempt in range(max_retries):
        try:
            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return {
                "stdout": result.stdout[:10000],  # Increased to 10000 chars for nmap
                "stderr": result.stderr[:2000],
                "returncode": result.returncode
            }
        except subprocess.TimeoutExpired:
            if attempt < max_retries - 1:
                logger.warning(f"Command timeout (attempt {attempt+1}/{max_retries}), retrying with longer timeout...")
                timeout += 300  # Add 5 more minutes
                continue
            logger.error(f"Command timed out after {max_retries} attempts")
            return {"error": f"Command timed out after {timeout}s", "timeout": True}
        except Exception as e:
            logger.error(f"Command execution failed: {str(e)}")
            if attempt < max_retries - 1:
                logger.warning(f"Retrying (attempt {attempt+1}/{max_retries})...")
                continue
            return {"error": str(e), "failed": True}

def validate_target(target, target_type):
    """Validate target input to prevent command injection"""
    if not target or len(target) > 255:
        return False
    
    if target_type == "Domain/IP":
        # Check for dangerous characters
        forbidden = [";", "|", "&", "$", "`", "\n", "\r"]
        return not any(char in target for char in forbidden)
    
    elif target_type == "Username":
        # Alphanumeric, underscore, hyphen only
        return target.replace("_", "").replace("-", "").replace(".", "").isalnum()
    
    return False

def execute_tool(tool, target):
    """Execute a specific reconnaissance tool"""
    commands = {
        "WHOIS": f"whois {target}",
        "DNS": f"dig {target} +short",
        "DNS (Full)": f"dig {target} ANY",
        "Reverse DNS": f"dig -x {target}",
        "TLS Certificate": f"openssl s_client -connect {target}:443 -servername {target} 2>/dev/null | openssl x509 -noout -text",
        "HTTP Headers": f"curl -I https://{target} 2>&1",
        "Nmap Basic": f"nmap -sV -p 1-1000 --max-rate 100 {target}",
        "Nmap Aggressive": f"nmap -sV -p 1-1000 --script vuln --max-rate 50 {target}",
        "DNS Zone Transfer": f"dig @{target} axfr",
        "Sherlock": f"sherlock {target} --timeout 1 2>/dev/null"
    }
    
    if tool not in commands:
        return {"error": f"Unknown tool: {tool}"}
    
    logger.info(f"Executing {tool} against {target}")
    
    # Increased timeouts for heavy scans
    timeout_map = {
        "Nmap Aggressive": 600,
        "Nmap Basic": 300,
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
            "DNS Zone Transfer"
        ],
        "Username": [
            "Sherlock"
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
            "Sherlock": "Search usernames across social media platforms"
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
        
        for i, tool in enumerate(tools):
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
# MAIN
# ============================================================================

if __name__ == "__main__":
    logger.info("Starting Recon-as-a-Service")
    app.run(debug=True, host="0.0.0.0", port=5000)
