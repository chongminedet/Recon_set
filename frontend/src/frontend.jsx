import React, { useState, useEffect } from 'react';
import './frontend.css';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

export default function ReconApp() {
  const [targetType, setTargetType] = useState('Domain/IP');
  const [target, setTarget] = useState('');
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanId, setScanId] = useState(null);
  const [scanStatus, setScanStatus] = useState(null);
  const [error, setError] = useState('');

  // Fetch available tools when target type changes
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch(`${API_BASE}/tools?type=${encodeURIComponent(targetType)}`);
        const data = await response.json();
        setAvailableTools(data.tools);
        setSelectedTools([]); // Reset selection when type changes
      } catch (err) {
        setError('Failed to load tools');
      }
    };
    fetchTools();
  }, [targetType]);

  // Poll scan status
  useEffect(() => {
    if (!scanId || !scanning) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/scan/${scanId}`);
        const data = await response.json();
        setScanStatus(data);

        if (data.status === 'completed' || data.status === 'failed') {
          setScanning(false);
        }
      } catch (err) {
        console.error('Failed to fetch scan status:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [scanId, scanning]);

  const handleTargetTypeChange = (e) => {
    setTargetType(e.target.value);
  };

  const handleToolToggle = (tool) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    );
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
      <header className="app-header">
        <div className="header-content">
          <h1>RECON_SET </h1>
          <p> reconnaissance scanning in your browser</p>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {/* Scan Configuration Panel */}
          <div className="panel config-panel">
            <h2>Configure Scan</h2>

            {/* Target Type Selection */}
            <div className="form-group">
              <label htmlFor="target-type">Target Type</label>
              <select
                id="target-type"
                value={targetType}
                onChange={handleTargetTypeChange}
                className="form-control"
              >
                <option value="Domain/IP">Domain/IP Address</option>
                <option value="Username">Username</option>
              </select>
            </div>

            {/* Target Input */}
            <div className="form-group">
              <label htmlFor="target-input">
                {targetType === 'Domain/IP' ? 'Domain or IP' : 'Username'}
              </label>
              <input
                id="target-input"
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={targetType === 'Domain/IP' ? 'example.com or 192.168.1.1' : 'john_doe'}
                className="form-control"
                disabled={scanning}
              />
            </div>

            {/* Tool Selection */}
            <div className="form-group">
              <label>Select Tools ({selectedTools.length}/{availableTools.length})</label>
              <div className="tools-grid">
                {availableTools.map((tool) => (
                  <label key={tool} className="tool-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTools.includes(tool)}
                      onChange={() => handleToolToggle(tool)}
                      disabled={scanning}
                    />
                    <span>{tool}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Start Button */}
            <button
              onClick={handleStartScan}
              disabled={scanning}
              className="btn btn-primary btn-large"
            >
              {scanning ? 'Scanning...' : 'Start Scan'}
            </button>
          </div>

          {/* Results Panel */}
          {scanStatus && (
            <div className="panel results-panel">
              <h2>Scan Results</h2>

              {/* Progress Bar */}
              <div className="progress-section">
                <div className="progress-header">
                  <span>Progress</span>
                  <span className="progress-percent">{scanStatus.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${scanStatus.progress}%` }}
                  />
                </div>
                <p className="status-text">Status: <strong>{scanStatus.status}</strong></p>
              </div>

              {/* Results Tabs */}
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

              {/* Export Buttons */}
              {scanStatus.status === 'completed' && (
                <div className="export-section">
                  <p>Export results:</p>
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
      </main>

      <footer className="app-footer">
        <p>Recon_set © 2026 | All tools run server-side.</p>
      </footer>
    </div>
  );
}
