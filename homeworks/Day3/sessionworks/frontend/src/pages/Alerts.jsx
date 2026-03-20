import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Info, RefreshCw } from "lucide-react";
import { alertsAPI } from "../services/api";

const SEVERITY_ICONS = {
  critical: <AlertCircle size={16} className="text-red-500" />,
  warning:  <AlertTriangle size={16} className="text-yellow-500" />,
  info:     <Info size={16} className="text-blue-400" />,
};

const SEVERITY_BADGE = {
  critical: "bg-red-100 text-red-700",
  warning:  "bg-yellow-100 text-yellow-700",
  info:     "bg-blue-100 text-blue-700",
};

const TYPE_LABELS = {
  new_subdomain: "New Subdomain",
  port_open:     "Open Port Found",
  ssl_expiry:    "SSL Issue",
  scan_empty:    "Empty Scan",
  scan_failed:   "Scan Failed",
  new_dns:       "New DNS Record",
};

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [unresolved, setUnresolved] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const resolved = filter === "resolved" ? true : filter === "unresolved" ? false : undefined;
      const data = await alertsAPI.list(resolved);
      setAlerts(data.data || []);
      setUnresolved(data.unresolved_count || 0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, [filter]);

  const handleResolve = async (id) => {
    setResolvingId(id);
    try {
      await alertsAPI.resolve(id);
      await loadAlerts();
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bell size={24} />
            Alerts
            {unresolved > 0 && (
              <span style={{ background: "#ef4444", color: "white", borderRadius: "9999px", fontSize: "0.75rem", padding: "2px 8px" }}>
                {unresolved}
              </span>
            )}
          </h1>
          <p className="text-muted">Notifications generated automatically after each scan.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadAlerts} disabled={loading}>
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {["all", "unresolved", "resolved"].map((f) => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: "capitalize" }}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner" />
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <CheckCircle size={48} style={{ color: "#22c55e", margin: "0 auto 1rem" }} />
          <p className="text-muted">No alerts found.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {alerts.map((a) => (
            <div
              key={a.id}
              className="card"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                opacity: a.resolved ? 0.6 : 1,
                borderLeft: `4px solid ${a.severity === "critical" ? "#ef4444" : a.severity === "warning" ? "#f59e0b" : "#60a5fa"}`,
              }}
            >
              <div style={{ marginTop: "2px" }}>
                {SEVERITY_ICONS[a.severity] || SEVERITY_ICONS.info}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600 }}>{TYPE_LABELS[a.alert_type] || a.alert_type}</span>
                  <span className={`badge ${SEVERITY_BADGE[a.severity] || SEVERITY_BADGE.info}`} style={{ fontSize: "0.7rem", padding: "1px 6px", borderRadius: "4px" }}>
                    {a.severity}
                  </span>
                  {a.resolved && (
                    <span style={{ fontSize: "0.7rem", color: "#22c55e" }}>✓ resolved</span>
                  )}
                </div>
                <p style={{ margin: "0.25rem 0 0", color: "#374151" }}>{a.message}</p>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                  {new Date(a.created_at).toLocaleString()}
                  {a.asset_id && <> · asset: {a.asset_id.slice(0, 8)}</>}
                </p>
              </div>
              {!a.resolved && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleResolve(a.id)}
                  disabled={resolvingId === a.id}
                  title="Mark as resolved"
                >
                  {resolvingId === a.id ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alerts;
