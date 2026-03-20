import { useState, useEffect } from "react";
import { FileText, Globe, Server, Wifi, Lock, Cpu } from "lucide-react";
import { assetsAPI, resultsAPI } from "../services/api";

function safeJSON(str) {
  if (!str) return null;
  try { return typeof str === "string" ? JSON.parse(str) : str; } catch { return null; }
}

function Results() {
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [resultType, setResultType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [whoisData, setWhoisData]       = useState(null);
  const [dnsData, setDnsData]           = useState([]);
  const [subdomainData, setSubdomainData] = useState([]);
  const [ipData, setIpData]             = useState([]);
  const [portData, setPortData]         = useState([]);
  const [sslData, setSslData]           = useState([]);
  const [techData, setTechData]         = useState([]);

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
    const shouldLoad = (t) => type === "all" || type === t;
    try {
      if (shouldLoad("whois")) {
        try { setWhoisData(await resultsAPI.getWHOIS(assetId)); } catch { setWhoisData(null); }
      }
      if (shouldLoad("dns")) {
        const d = await resultsAPI.getDNS(assetId); setDnsData(d.data || []);
      }
      if (shouldLoad("subdomains")) {
        const d = await resultsAPI.getSubdomains(assetId); setSubdomainData(d.data || []);
      }
      if (shouldLoad("ip")) {
        try { setIpData(await resultsAPI.getIP(assetId)); } catch { setIpData([]); }
      }
      if (shouldLoad("ports")) {
        try { setPortData(await resultsAPI.getPorts(assetId)); } catch { setPortData([]); }
      }
      if (shouldLoad("ssl")) {
        try { setSslData(await resultsAPI.getSSL(assetId)); } catch { setSslData([]); }
      }
      if (shouldLoad("tech")) {
        try { setTechData(await resultsAPI.getTech(assetId)); } catch { setTechData([]); }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedAssetData = assets.find((a) => a.id === selectedAsset);

  // ── Renderers ──────────────────────────────────────────────────────────────

  const renderWHOIS = (whois) => {
    if (!whois) return <div className="p-4"><p className="text-muted">No WHOIS data found</p></div>;
    return (
      <div className="p-4 grid grid-2" style={{ gap: "var(--spacing-md)" }}>
        <InfoRow label="Registrar" value={whois.registrar} />
        <InfoRow label="Status" value={whois.status} />
        <InfoRow label="Created" value={whois.created_date ? new Date(whois.created_date).toLocaleDateString() : null} />
        <InfoRow label="Expires" value={whois.expiry_date ? new Date(whois.expiry_date).toLocaleDateString() : null} />
        {whois.name_servers && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="text-xs font-semibold text-muted">Name Servers</label>
            <div className="flex flex-wrap gap-2" style={{ marginTop: "var(--spacing-xs)" }}>
              {(() => {
                const servers = safeJSON(whois.name_servers);
                return Array.isArray(servers) ? servers.map((ns, i) => <span key={i} className="badge badge-info">{ns}</span>) : null;
              })()}
            </div>
          </div>
        )}
        {whois.raw_data && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="text-xs font-semibold text-muted">Raw Data</label>
            <pre className="p-4 bg-gray-50 rounded-md text-xs overflow-x-auto" style={{ marginTop: "var(--spacing-xs)" }}>{whois.raw_data}</pre>
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
                <td><span className={`badge ${s.is_active ? "badge-success" : "badge-secondary"}`}>{s.is_active ? "Yes" : "No"}</span></td>
                <td className="text-sm text-muted">{s.created_at ? new Date(s.created_at).toLocaleDateString() : "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderIP = (results) => {
    if (!results || results.length === 0) return <div className="p-4"><p className="text-muted">No IP scan data found</p></div>;
    return results.map((r, i) => {
      const geo = safeJSON(r.geolocation);
      const asn = safeJSON(r.asn);
      return (
        <div key={r.id || i} className="p-4" style={{ borderBottom: i < results.length - 1 ? "1px solid var(--color-border)" : "none" }}>
          <div className="grid grid-2" style={{ gap: "var(--spacing-md)" }}>
            <InfoRow label="IP Address" value={r.ip_address} />
            <InfoRow label="Reverse DNS" value={r.reverse_dns || "N/A"} />
            {geo && (
              <>
                <InfoRow label="Country" value={geo.country} />
                <InfoRow label="City" value={geo.city} />
                <InfoRow label="Region" value={geo.region} />
                <InfoRow label="ISP" value={geo.isp || geo.org} />
                {geo.lat && <InfoRow label="Coordinates" value={`${geo.lat}, ${geo.lon}`} />}
              </>
            )}
            {asn && (
              <>
                <InfoRow label="ASN" value={asn.asn} />
                <InfoRow label="AS Org" value={asn.org || asn.description} />
              </>
            )}
          </div>
        </div>
      );
    });
  };

  const renderPorts = (results) => {
    if (!results || results.length === 0) return <div className="p-4"><p className="text-muted">No port scan data found</p></div>;
    return results.map((r, i) => {
      const openPorts = safeJSON(r.open_ports);
      return (
        <div key={r.id || i} className="p-4" style={{ borderBottom: i < results.length - 1 ? "1px solid var(--color-border)" : "none" }}>
          <div className="grid grid-2" style={{ gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
            <InfoRow label="IP Address" value={r.ip_address} />
            <InfoRow label="Total Scanned" value={r.total_scanned} />
            <InfoRow label="Closed Ports" value={r.closed_ports} />
            <InfoRow label="Scan Duration" value={`${r.scan_duration_ms}ms`} />
          </div>
          {Array.isArray(openPorts) && openPorts.length > 0 && (
            <>
              <label className="text-xs font-semibold text-muted">Open Ports</label>
              <div className="table-container" style={{ marginTop: "var(--spacing-xs)" }}>
                <table className="table">
                  <thead><tr><th>Port</th><th>Protocol</th><th>Service</th><th>Banner</th></tr></thead>
                  <tbody>
                    {openPorts.map((p, j) => (
                      <tr key={j}>
                        <td><span className="badge badge-danger">{p.port}</span></td>
                        <td className="text-sm">{p.protocol || "tcp"}</td>
                        <td className="text-sm font-medium">{p.service || "unknown"}</td>
                        <td className="text-sm text-muted">{p.banner || "–"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      );
    });
  };

  const renderSSL = (results) => {
    if (!results || results.length === 0) return <div className="p-4"><p className="text-muted">No SSL scan data found</p></div>;
    return results.map((r, i) => {
      const cert = safeJSON(r.certificate);
      const conn = safeJSON(r.connection);
      const issues = safeJSON(r.issues);
      return (
        <div key={r.id || i} className="p-4" style={{ borderBottom: i < results.length - 1 ? "1px solid var(--color-border)" : "none" }}>
          <div className="grid grid-2" style={{ gap: "var(--spacing-md)" }}>
            <InfoRow label="Domain" value={r.domain} />
            <div>
              <label className="text-xs font-semibold text-muted">Grade</label>
              <p><span className={`badge ${r.grade === "A" || r.grade === "A+" ? "badge-success" : r.grade?.startsWith("B") ? "badge-warning" : "badge-danger"}`}>{r.grade || "N/A"}</span></p>
            </div>
            {cert && (
              <>
                <InfoRow label="Subject" value={cert.subject} />
                <InfoRow label="Issuer" value={cert.issuer} />
                <InfoRow label="Valid From" value={cert.not_before ? new Date(cert.not_before).toLocaleDateString() : null} />
                <InfoRow label="Valid Until" value={cert.not_after ? new Date(cert.not_after).toLocaleDateString() : null} />
              </>
            )}
            {conn && <InfoRow label="TLS Version" value={conn.tls_version} />}
          </div>
          {Array.isArray(issues) && issues.length > 0 && (
            <div style={{ marginTop: "var(--spacing-md)" }}>
              <label className="text-xs font-semibold text-muted">Issues</label>
              <ul style={{ listStyle: "disc", paddingLeft: "1.5rem", marginTop: "var(--spacing-xs)" }}>
                {issues.map((issue, j) => <li key={j} className="text-sm text-muted">{issue}</li>)}
              </ul>
            </div>
          )}
        </div>
      );
    });
  };

  const renderTech = (results) => {
    if (!results || results.length === 0) return <div className="p-4"><p className="text-muted">No tech detection data found</p></div>;
    return results.map((r, i) => {
      const techs = safeJSON(r.technologies);
      const headers = safeJSON(r.headers);
      return (
        <div key={r.id || i} className="p-4" style={{ borderBottom: i < results.length - 1 ? "1px solid var(--color-border)" : "none" }}>
          <InfoRow label="Domain" value={r.domain} />
          {Array.isArray(techs) && techs.length > 0 && (
            <div style={{ marginTop: "var(--spacing-md)" }}>
              <label className="text-xs font-semibold text-muted">Detected Technologies</label>
              <div className="flex flex-wrap gap-2" style={{ marginTop: "var(--spacing-xs)" }}>
                {techs.map((t, j) => <span key={j} className="badge badge-primary">{typeof t === "string" ? t : t.name || JSON.stringify(t)}</span>)}
              </div>
            </div>
          )}
          {headers && typeof headers === "object" && Object.keys(headers).length > 0 && (
            <div style={{ marginTop: "var(--spacing-md)" }}>
              <label className="text-xs font-semibold text-muted">HTTP Headers</label>
              <div className="table-container" style={{ marginTop: "var(--spacing-xs)" }}>
                <table className="table">
                  <thead><tr><th>Header</th><th>Value</th></tr></thead>
                  <tbody>
                    {Object.entries(headers).map(([k, v], j) => (
                      <tr key={j}><td className="font-medium text-sm">{k}</td><td className="text-sm text-muted">{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  // ── Main render ────────────────────────────────────────────────────────────

  const show = (t) => resultType === "all" || resultType === t;

  const panels = [
    { key: "whois",     icon: <Server size={20} />,  title: "WHOIS Information",     content: renderWHOIS(whoisData),       count: null },
    { key: "dns",       icon: <Globe size={20} />,   title: "DNS Records",           content: renderDNS(dnsData),           count: dnsData.length },
    { key: "subdomains",icon: <Globe size={20} />,   title: "Subdomains",            content: renderSubdomains(subdomainData), count: subdomainData.length },
    { key: "ip",        icon: <Wifi size={20} />,    title: "IP / Geolocation",      content: renderIP(ipData),             count: ipData.length },
    { key: "ports",     icon: <Cpu size={20} />,     title: "Port Scan",             content: renderPorts(portData),        count: portData.length },
    { key: "ssl",       icon: <Lock size={20} />,    title: "SSL / TLS",             content: renderSSL(sslData),           count: sslData.length },
    { key: "tech",      icon: <Cpu size={20} />,     title: "Technology Detection",  content: renderTech(techData),         count: techData.length },
  ];

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
              <option value="ip">IP / Geolocation</option>
              <option value="dns">DNS Records</option>
              <option value="subdomains">Subdomains</option>
              <option value="whois">WHOIS Information</option>
              <option value="ports">Port Scan</option>
              <option value="ssl">SSL / TLS</option>
              <option value="tech">Technology Detection</option>
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
          {panels.filter((p) => show(p.key)).map((p) => (
            <div key={p.key} className="card">
              <div className="card-header">
                <h3 className="card-title flex items-center">
                  <span className="mr-2 inline">{p.icon}</span>
                  {p.title}
                  {p.count !== null && (
                    <span className="badge badge-secondary" style={{ marginLeft: "var(--spacing-sm)" }}>{p.count}</span>
                  )}
                </h3>
              </div>
              {p.content}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted">{label}</label>
      <p className="text-sm">{value || "N/A"}</p>
    </div>
  );
}

export default Results;
