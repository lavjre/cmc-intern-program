import { useState, useEffect } from "react";
import { Clock, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw } from "lucide-react";
import { assetsAPI, schedulesAPI } from "../services/api";

const INTERVAL_OPTIONS = [
  { value: 1,   label: "Every hour" },
  { value: 6,   label: "Every 6 hours" },
  { value: 12,  label: "Every 12 hours" },
  { value: 24,  label: "Daily (24 h)" },
  { value: 168, label: "Weekly" },
];

const SCAN_TYPES = [
  "all", "dns", "whois", "subdomain", "ip", "asn", "cert_trans",
  "port", "ssl", "tech",
];

function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ asset_id: "", scan_type: "dns", interval_hours: 24 });

  const load = async () => {
    setLoading(true);
    try {
      const [sched, assetData] = await Promise.all([
        schedulesAPI.list(),
        assetsAPI.list({ page_size: 100 }),
      ]);
      setSchedules(sched);
      setAssets(assetData.data || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.asset_id) { setError("Select an asset"); return; }
    setCreating(true);
    setError("");
    try {
      await schedulesAPI.create({
        asset_id: form.asset_id,
        scan_type: form.scan_type,
        interval_hours: Number(form.interval_hours),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    await schedulesAPI.delete(id);
    await load();
  };

  const handleToggle = async (sc) => {
    await schedulesAPI.toggle(sc.id, !sc.enabled);
    await load();
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Clock size={24} /> Scheduled Scans
        </h1>
        <p className="text-muted">Automatically run scans on a schedule. The server checks every minute.</p>
      </div>

      {/* Create form */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="card-title">New Schedule</h2>
        {error && <div className="alert alert-error" style={{ marginBottom: "0.75rem", color: "#ef4444" }}>{error}</div>}
        <form onSubmit={handleCreate} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label className="form-label">Asset</label>
            <select className="form-input" value={form.asset_id} onChange={e => setForm(f => ({ ...f, asset_id: e.target.value }))}>
              <option value="">— select asset —</option>
              {assets.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 140px" }}>
            <label className="form-label">Scan Type</label>
            <select className="form-input" value={form.scan_type} onChange={e => setForm(f => ({ ...f, scan_type: e.target.value }))}>
              {SCAN_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label className="form-label">Interval</label>
            <select className="form-input" value={form.interval_hours} onChange={e => setForm(f => ({ ...f, interval_hours: e.target.value }))}>
              {INTERVAL_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating} style={{ whiteSpace: "nowrap" }}>
            {creating ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            Add Schedule
          </button>
        </form>
      </div>

      {/* Schedule list */}
      {loading ? (
        <div className="loading-spinner" />
      ) : schedules.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <Clock size={48} style={{ color: "#9ca3af", margin: "0 auto 1rem" }} />
          <p className="text-muted">No schedules yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {schedules.map((sc) => {
            const asset = assets.find(a => a.id === sc.asset_id);
            const intervalLabel = INTERVAL_OPTIONS.find(o => o.value === sc.interval_hours)?.label
              || `Every ${sc.interval_hours} h`;
            return (
              <div key={sc.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>
                    {asset?.name || sc.asset_id.slice(0, 12)}
                    <span style={{ marginLeft: "0.5rem", color: "#6366f1", fontWeight: 400, fontSize: "0.85rem" }}>
                      {sc.scan_type}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#9ca3af", marginTop: "0.2rem" }}>
                    {intervalLabel}
                    {sc.next_run && (
                      <> · next: {new Date(sc.next_run).toLocaleString()}</>
                    )}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleToggle(sc)}
                  title={sc.enabled ? "Disable" : "Enable"}
                >
                  {sc.enabled
                    ? <ToggleRight size={20} style={{ color: "#22c55e" }} />
                    : <ToggleLeft size={20} style={{ color: "#9ca3af" }} />}
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => handleDelete(sc.id)}
                  title="Delete schedule"
                  style={{ color: "#ef4444" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Schedules;
