import { useState, useEffect } from "react";
import { Database, Activity, FileText, TrendingUp } from "lucide-react";
import { assetsAPI, healthCheck } from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    totalScans: 0,
    completedScans: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await healthCheck();
      const assetsData = await assetsAPI.list({ page: 1, page_size: 1 });
      const activeData = await assetsAPI.list({ status: "active", page: 1, page_size: 1 });
      setStats({
        totalAssets: assetsData.total || 0,
        activeAssets: activeData.total || 0,
        totalScans: 0,
        completedScans: 0,
      });
    } catch (error) {
      console.error("Failed to load dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">
          Overview of your External Attack Surface Management system
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Assets</span>
            <div className="stat-icon" style={{ color: "var(--color-primary)" }}>
              <Database size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalAssets}</div>
          <div className="stat-change">{stats.activeAssets} active</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Assets</span>
            <div className="stat-icon" style={{ color: "var(--color-success)" }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.activeAssets}</div>
          <div className="stat-change">Currently monitored</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Scans</span>
            <div className="stat-icon" style={{ color: "var(--color-info)" }}>
              <Activity size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.totalScans}</div>
          <div className="stat-change">All time</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Completed Scans</span>
            <div className="stat-icon" style={{ color: "var(--color-warning)" }}>
              <FileText size={20} />
            </div>
          </div>
          <div className="stat-value">{stats.completedScans}</div>
          <div className="stat-change">Successfully completed</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">🔍 Passive Scanning</h3>
          </div>
          <p className="text-muted mb-4">
            Safe reconnaissance using publicly available information (OSINT)
          </p>
          <ul className="text-sm" style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
            <li><strong>DNS Scanning:</strong> A, AAAA, MX, NS, TXT, CNAME records</li>
            <li><strong>WHOIS Lookup:</strong> Domain registration information</li>
            <li><strong>Subdomain Enumeration:</strong> DNS bruteforce discovery</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">⚡ Active Scanning</h3>
          </div>
          <div className="alert alert-warning mb-4">
            ⚠️ Requires explicit authorization from target owner
          </div>
          <ul className="text-sm" style={{ listStyle: "disc", paddingLeft: "1.5rem" }}>
            <li><strong>Port Scanning:</strong> TCP service discovery</li>
            <li><strong>SSL/TLS Probing:</strong> Certificate and config analysis</li>
            <li><strong>Tech Detection:</strong> Framework and stack fingerprinting</li>
          </ul>
          <p className="text-muted text-xs mt-4">
            <strong>Legal Notice:</strong> Active scans may be illegal without permission.
            Only scan systems you own or have written authorization to test.
          </p>
        </div>
      </div>

      <div className="card mt-4">
        <div className="card-header">
          <h3 className="card-title">Quick Start</h3>
        </div>
        <div className="grid grid-3">
          <div>
            <h4 className="font-semibold mb-2">1. Add Assets</h4>
            <p className="text-sm text-muted">Start by adding domains, IPs, or services to monitor</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">2. Run Scans</h4>
            <p className="text-sm text-muted">Execute passive or active scans to discover your attack surface</p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">3. View Results</h4>
            <p className="text-sm text-muted">Analyze scan results and track your security posture</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
