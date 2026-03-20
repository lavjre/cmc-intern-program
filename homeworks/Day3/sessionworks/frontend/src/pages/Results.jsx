import { useState, useEffect } from "react";
import { FileText, Globe, Server } from "lucide-react";
import { assetsAPI, resultsAPI } from "../services/api";

function Results() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [resultType, setResultType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [whoisData, setWhoisData] = useState(null);
  const [dnsData, setDnsData] = useState([]);
  const [subdomainData, setSubdomainData] = useState([]);

  useEffect(() => { loadAssets(); }, []);

  useEffect(() => {
    if (selectedAsset) loadResults(selectedAsset, resultType);
  }, [selectedAsset, resultType]);

  const loadAssets = async () => {
    try {
      const data = await assetsAPI.list({ page_size: 100 });
      setAssets(data.data || []);
      if (data.data && data.data.length > 0) setSelectedAsset(data.data[0].id);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadResults = async (assetId, type) => {
    setLoading(true);
    setError("");
    try {
      if (type === "all" || type === "whois") {
        try {
          const d = await resultsAPI.getWHOIS(assetId);
          setWhoisData(d);
        } catch { setWhoisData(null); }
      }
      if (type === "all" || type === "dns") {
        const d = await resultsAPI.getDNS(assetId);
        setDnsData(d.data || []);
      }
      if (type === "all" || type === "subdomains") {
        const d = await resultsAPI.getSubdomains(assetId);
        setSubdomainData(d.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedAssetData = assets.find((a) => a.id === selectedAsset);

  const renderWHOIS = (whois) => {
    if (!whois) return <div className="p-4"><p className="text-muted">No WHOIS data found</p></div>;
    return (
      <div className="p-4 grid grid-2" style={{ gap: "var(--spacing-md)" }}>
        <div>
          <label className="text-xs font-semibold text-muted">Registrar</label>
          <p>{whois.registrar || "N/A"}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Status</label>
          <p>{whois.status || "N/A"}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Created</label>
          <p>{whois.created_date ? new Date(whois.created_date).toLocaleDateString() : "N/A"}</p>
        </div>
        <div>
          <label className="text-xs font-semibold text-muted">Expires</label>
          <p>{whois.expiry_date ? new Date(whois.expiry_date).toLocaleDateString() : "N/A"}</p>
        </div>
        {whois.name_servers && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="text-xs font-semibold text-muted">Name Servers</label>
            <div className="flex flex-wrap gap-2 mt-4" style={{ marginTop: "var(--spacing-xs)" }}>
              {(() => {
                try {
                  const servers = typeof whois.name_servers === "string" ? JSON.parse(whois.name_servers) : whois.name_servers;
                  return Array.isArray(servers) ? servers.map((ns, i) => <span key={i} className="badge badge-info">{ns}</span>) : null;
                } catch { return null; }
              })()}
            </div>
          </div>
        )}
        {whois.raw_data && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="text-xs font-semibold text-muted">Raw Data</label>
            <pre className="mt-4 p-4 bg-gray-50 rounded-md text-xs overflow-x-auto" style={{ marginTop: "var(--spacing-xs)" }}>{whois.raw_data}</pre>
          </div>
        )}
      </div>
    );
  };

  const renderDNS = (records) => {
    if (!records || records.length === 0) return <div className="p-4"><p className="text-muted">No DNS records found</p></div>;
    return (
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Type</th><th>Name</th><th>Value</th><th>TTL</th></tr></thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id || i}>
                <td><span className="badge badge-info">{r.record_type}</span></td>
                <td className="font-medium">{r.name}</td>
                <td className="text-sm" style={{ wordBreak: "break-all" }}>{r.value}</td>
                <td className="text-sm text-muted">{r.ttl}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubdomains = (subdomains) => {
    if (!subdomains || subdomains.length === 0) return <div className="p-4"><p className="text-muted">No subdomains found</p></div>;
    return (
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Subdomain</th><th>Source</th><th>Active</th><th>Discovered</th></tr></thead>
          <tbody>
            {subdomains.map((s, i) => (
              <tr key={s.id || i}>
                <td className="font-medium">{s.name}</td>
                <td><span className="badge badge-info">{s.source}</span></td>
                <td>
                  <span className={`badge ${s.is_active ? "badge-success" : "badge-secondary"}`}>
                    {s.is_active ? "Yes" : "No"}
                  </span>
                </td>
                <td className="text-sm text-muted">
                  {s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Scan Results</h1>
        <p className="page-description">View and analyze reconnaissance data collected from scans</p>
      </div>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div className="card mb-4">
        <div className="grid grid-2" style={{ gap: "var(--spacing-md)" }}>
          <div className="form-group">
            <label className="form-label">Select Asset</label>
            <select className="form-select" value={selectedAsset} onChange={(e) => setSelectedAsset(e.target.value)}>
              {assets.length === 0
                ? <option>No assets available</option>
                : assets.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.type})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Result Type</label>
            <select className="form-select" value={resultType} onChange={(e) => setResultType(e.target.value)}>
              <option value="all">All Results</option>
              <option value="dns">DNS Records</option>
              <option value="subdomains">Subdomains</option>
              <option value="whois">WHOIS Information</option>
            </select>
          </div>
        </div>
        {selectedAssetData && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="flex items-center gap-4 text-sm text-muted">
              <span><strong>Name:</strong> {selectedAssetData.name}</span>
              <span><strong>Type:</strong> {selectedAssetData.type}</span>
              <span><strong>Status:</strong> {selectedAssetData.status}</span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="card"><div className="loading"><div className="spinner"></div><span>Loading results...</span></div></div>
      ) : !selectedAsset ? (
        <div className="card">
          <div className="empty-state">
            <FileText className="empty-state-icon" size={64} />
            <h3 className="empty-state-title">No asset selected</h3>
            <p className="empty-state-description">Select an asset to view its scan results</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>
          {(resultType === "all" || resultType === "whois") && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center"><Server size={20} className="mr-2 inline" /> WHOIS Information</h3>
              </div>
              {renderWHOIS(whoisData)}
            </div>
          )}
          {(resultType === "all" || resultType === "dns") && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center">
                  <Globe size={20} className="mr-2 inline" /> DNS Records
                  <span className="badge badge-secondary" style={{ marginLeft: "var(--spacing-sm)" }}>{dnsData.length}</span>
                </h3>
              </div>
              {renderDNS(dnsData)}
            </div>
          )}
          {(resultType === "all" || resultType === "subdomains") && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center">
                  <Globe size={20} className="mr-2 inline" /> Subdomains
                  <span className="badge badge-secondary" style={{ marginLeft: "var(--spacing-sm)" }}>{subdomainData.length}</span>
                </h3>
              </div>
              {renderSubdomains(subdomainData)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Results;
