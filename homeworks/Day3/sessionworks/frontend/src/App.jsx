import { useState, useEffect, useCallback } from "react";
import {
  Container, Row, Col, Card, Button, Form, InputGroup,
  Badge, Spinner, Alert, Accordion, Table, ButtonGroup,
  Navbar, Nav, OverlayTrigger, Tooltip, ListGroup, Stack
} from "react-bootstrap";
import {
  getAssets, createAsset, deleteAsset,
  startScan, getScanJob, getAssetResults,
} from "./api";

const SCAN_META = {
  dns:       { label: "DNS",  desc: "DNS Records (A, MX, NS, TXT)", variant: "primary" },
  whois:     { label: "WHOIS", desc: "WHOIS Registration Info", variant: "info" },
  subdomain: { label: "SUB",  desc: "Subdomain Enumeration", variant: "secondary" },
  ssl:       { label: "SSL",  desc: "SSL/TLS Certificate Analysis", variant: "warning" },
  tech:      { label: "TECH", desc: "Technology Detection", variant: "dark" },
  ip:        { label: "IP",   desc: "IP Geolocation & ASN", variant: "success" },
  port:      { label: "PORT", desc: "Port Scan (private IP only)", variant: "danger" },
};

const RESULT_LABELS = {
  dns_records: "DNS Records", subdomains: "Subdomains", whois: "WHOIS Registration",
  ip_scan: "IP Geolocation & ASN", port_scan: "Port Scan",
  ssl_scan: "SSL/TLS Certificate", tech_scan: "Technology Detection",
};

const SKIP = new Set(["id", "asset_id", "scan_job_id"]);

function renderValue(val) {
  if (val === null || val === undefined) return <span className="text-muted fst-italic">null</span>;
  if (typeof val === "boolean") return <Badge bg={val ? "success" : "danger"}>{String(val)}</Badge>;
  if (typeof val === "number") return <span className="fw-semibold text-warning">{val}</span>;
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      if (typeof p === "object") return <pre className="bg-light border rounded p-2 mb-0 small" style={{maxHeight:180,overflow:"auto"}}>{JSON.stringify(p, null, 2)}</pre>;
    } catch {}
    return <span className="text-success">{val}</span>;
  }
  if (typeof val === "object") return <pre className="bg-light border rounded p-2 mb-0 small" style={{maxHeight:180,overflow:"auto"}}>{JSON.stringify(val, null, 2)}</pre>;
  return String(val);
}

function ResultSection({ title, data }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <Accordion.Item eventKey={title}>
      <Accordion.Header>
        <div className="d-flex justify-content-between w-100 me-3">
          <strong>{title}</strong>
          <Badge bg="secondary" pill>{items.length}</Badge>
        </div>
      </Accordion.Header>
      <Accordion.Body className="p-2">
        {items.map((item, i) => (
          <Card key={i} className="mb-2 border">
            <Card.Body className="p-0">
              {typeof item === "object" && item !== null ? (
                <Table size="sm" className="mb-0" bordered hover>
                  <tbody>
                    {Object.entries(item).filter(([k]) => !SKIP.has(k)).map(([k, v]) => (
                      <tr key={k}>
                        <td className="bg-light fw-medium text-capitalize text-muted" style={{width:140,fontSize:12}}>{k.replace(/_/g, " ")}</td>
                        <td style={{fontSize:13}}>{renderValue(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : <pre className="p-2 mb-0 small">{JSON.stringify(item, null, 2)}</pre>}
            </Card.Body>
          </Card>
        ))}
      </Accordion.Body>
    </Accordion.Item>
  );
}

export default function App() {
  const [assets, setAssets] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("domain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState(null);
  const [resLoading, setResLoading] = useState(false);
  const [jobs, setJobs] = useState({});
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await getAssets();
      setAssets(d.data || d || []);
    } catch { setError("Cannot connect to backend. Is it running on port 8080?"); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = assets.filter(a => {
    if (filter !== "all" && a.type !== filter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: assets.length,
    domains: assets.filter(a => a.type === "domain").length,
    ips: assets.filter(a => a.type === "ip").length,
  };

  const flash = (m) => { setSuccess(m); setTimeout(() => setSuccess(""), 3000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true); setError("");
    try {
      const a = await createAsset({ name: name.trim(), type });
      setName("");
      flash(`Added ${a.name}`);
      await load();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this asset and all scan data?")) return;
    try {
      await deleteAsset(id);
      if (selected?.id === id) { setSelected(null); setResults(null); }
      flash("Deleted"); await load();
    } catch (e) { setError(e.message); }
  };

  const handleScan = async (assetId, scanType) => {
    const k = `${assetId}-${scanType}`;
    setJobs(p => ({ ...p, [k]: { status: "starting" } }));
    try {
      const job = await startScan(assetId, scanType);
      setJobs(p => ({ ...p, [k]: { status: job.status, id: job.id } }));
      let n = 0;
      const iv = setInterval(async () => {
        n++;
        try {
          const u = await getScanJob(job.id);
          setJobs(p => ({ ...p, [k]: { status: u.status, id: u.id, results: u.results, error: u.error } }));
          if (["completed","failed","partial"].includes(u.status) || n > 30) {
            clearInterval(iv);
            if (selected?.id === assetId) loadRes(assetId);
          }
        } catch { clearInterval(iv); }
      }, 1500);
    } catch (e) { setJobs(p => ({ ...p, [k]: { status: "error", error: e.message } })); }
  };

  const scanAll = async (asset) => {
    const types = asset.type === "domain" ? ["dns","whois","ssl","tech"] : ["ip","port"];
    for (const t of types) await handleScan(asset.id, t);
  };

  const loadRes = async (id) => {
    setResLoading(true);
    try { setResults(await getAssetResults(id)); } catch { setResults(null); }
    setResLoading(false);
  };

  const select = (a) => { setSelected(a); setResults(null); loadRes(a.id); };

  const scanTypes = (t) => t === "domain" ? ["dns","whois","subdomain","ssl","tech"] : ["ip","port"];

  const jobBg = (s) => {
    if (s === "completed") return "success";
    if (s === "failed" || s === "error") return "danger";
    if (["running","pending","starting"].includes(s)) return "warning";
    return "secondary";
  };

  return (
    <div className="bg-light min-vh-100">
      <Navbar bg="white" className="border-bottom shadow-sm mb-3">
        <Container>
          <Navbar.Brand className="fw-bold text-primary fs-4">Mini EASM</Navbar.Brand>
          <Nav className="ms-auto">
            <Badge bg="success" className="d-flex align-items-center gap-1 px-3 py-2 rounded-pill">
              <span className="d-inline-block bg-white rounded-circle" style={{width:8,height:8,animation:"pulse 2s infinite"}} />
              Connected
            </Badge>
          </Nav>
        </Container>
      </Navbar>

      <Container>
        {/* Stats */}
        <Row className="g-3 mb-3">
          {[
            { n: stats.total, l: "Total Assets", bg: "primary" },
            { n: stats.domains, l: "Domains", bg: "info" },
            { n: stats.ips, l: "IP Addresses", bg: "success" },
            { n: Object.keys(jobs).length, l: "Scans Run", bg: "warning" },
            { n: Object.values(jobs).filter(j=>j.status==="completed").length, l: "Completed", bg: "success" },
            { n: Object.values(jobs).filter(j=>j.status==="failed"||j.status==="error").length, l: "Failed", bg: "danger" },
          ].map(({n,l,bg}) => (
            <Col key={l} xs={6} md={2}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body className="py-3">
                  <div className={`fs-3 fw-bold text-${bg}`}>{n}</div>
                  <small className="text-muted text-uppercase" style={{fontSize:10,letterSpacing:0.5}}>{l}</small>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Alerts */}
        {error && <Alert variant="danger" dismissible onClose={()=>setError("")}>{error}</Alert>}
        {success && <Alert variant="success" dismissible onClose={()=>setSuccess("")}>{success}</Alert>}

        {/* Create Form */}
        <Card className="mb-3 border-0 shadow-sm">
          <Card.Body>
            <Form onSubmit={handleCreate}>
              <InputGroup>
                <Form.Select value={type} onChange={e=>setType(e.target.value)} style={{maxWidth:150}}>
                  <option value="domain">Domain</option>
                  <option value="ip">IP Address</option>
                  <option value="service">Service</option>
                </Form.Select>
                <Form.Control
                  placeholder={type==="domain"?"google.com":type==="ip"?"127.0.0.1":"http://example.com"}
                  value={name} onChange={e=>setName(e.target.value)}
                />
                <Button variant="primary" type="submit" disabled={loading||!name.trim()}>
                  {loading ? <><Spinner size="sm" className="me-1"/>Adding...</> : "+ Add Asset"}
                </Button>
              </InputGroup>
            </Form>
          </Card.Body>
        </Card>

        {/* Filter + Search */}
        <div className="d-flex gap-2 mb-3 flex-wrap align-items-center">
          <ButtonGroup size="sm">
            {["all","domain","ip","service"].map(f => (
              <Button key={f} variant={filter===f?"primary":"outline-secondary"} onClick={()=>setFilter(f)}>
                {f==="all"?"All":f.charAt(0).toUpperCase()+f.slice(1)}
                {f!=="all" && <Badge bg="light" text="dark" className="ms-1">{assets.filter(a=>a.type===f).length}</Badge>}
              </Button>
            ))}
          </ButtonGroup>
          <Form.Control size="sm" placeholder="Search assets..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:220}} className="ms-auto" />
        </div>

        {/* Main Layout */}
        <Row className="g-3">
          {/* Asset List */}
          <Col md={5}>
            <Card className="border-0 shadow-sm">
              <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                <span className="fw-semibold text-muted small text-uppercase">Assets</span>
                <Badge bg="primary" pill>{filtered.length}</Badge>
              </Card.Header>
              <ListGroup variant="flush" style={{maxHeight:"72vh",overflowY:"auto"}}>
                {filtered.length === 0 && <ListGroup.Item className="text-center text-muted py-4">No assets found</ListGroup.Item>}
                {filtered.map(asset => (
                  <ListGroup.Item
                    key={asset.id} action active={selected?.id===asset.id}
                    onClick={()=>select(asset)}
                    className={selected?.id===asset.id ? "" : "bg-white"}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <Badge bg={asset.type==="domain"?"primary":asset.type==="ip"?"success":"secondary"}>
                        {asset.type}
                      </Badge>
                      <strong className="flex-grow-1" style={{fontSize:14}}>{asset.name}</strong>
                      <span className={`d-inline-block rounded-circle bg-${asset.status==="active"?"success":"secondary"}`}
                        style={{width:8,height:8}} title={asset.status} />
                    </div>
                    <Stack direction="horizontal" gap={1} className="flex-wrap">
                      {scanTypes(asset.type).map(st => {
                        const k = `${asset.id}-${st}`;
                        const j = jobs[k];
                        const m = SCAN_META[st];
                        return (
                          <OverlayTrigger key={st} placement="top" overlay={<Tooltip>{m.desc}{j?` (${j.status})`:""}</Tooltip>}>
                            <Button size="sm" variant={j?`outline-${jobBg(j.status)}`:`outline-${m.variant}`}
                              style={{fontSize:10,padding:"1px 6px",fontWeight:600}}
                              onClick={e=>{e.stopPropagation();handleScan(asset.id,st);}}>
                              {m.label}
                            </Button>
                          </OverlayTrigger>
                        );
                      })}
                      <Button size="sm" variant="outline-primary" style={{fontSize:10,padding:"1px 6px",fontWeight:600}}
                        onClick={e=>{e.stopPropagation();scanAll(asset);}}>ALL</Button>
                      <Button size="sm" variant="outline-danger" className="ms-auto" style={{fontSize:10,padding:"1px 6px"}}
                        onClick={e=>{e.stopPropagation();handleDelete(asset.id);}}>DEL</Button>
                    </Stack>
                    <div className="text-muted mt-1" style={{fontSize:10}}>
                      {new Date(asset.created_at).toLocaleString()}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>

          {/* Results Panel */}
          <Col md={7}>
            <Card className="border-0 shadow-sm" style={{position:"sticky",top:16}}>
              {selected ? (
                <>
                  <Card.Header className="bg-white border-bottom">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <Badge bg={selected.type==="domain"?"primary":selected.type==="ip"?"success":"secondary"}>
                            {selected.type}
                          </Badge>
                          <span className="fw-bold">{selected.name}</span>
                        </div>
                        <small className="text-muted font-monospace">{selected.id}</small>
                      </div>
                      <div className="d-flex gap-2">
                        <Button size="sm" variant="primary" onClick={()=>scanAll(selected)}>
                          Scan All
                        </Button>
                        <Button size="sm" variant="outline-primary" onClick={()=>loadRes(selected.id)} disabled={resLoading}>
                          {resLoading?<Spinner size="sm"/>:"Refresh"}
                        </Button>
                      </div>
                    </div>
                  </Card.Header>
                  <Card.Body style={{maxHeight:"68vh",overflowY:"auto"}}>
                    {results && Object.keys(results).length > 0 ? (
                      <Accordion defaultActiveKey={Object.keys(results).map((_,i)=>String(i))} alwaysOpen>
                        {Object.entries(results).map(([key,val],i) => (
                          <ResultSection key={key} title={RESULT_LABELS[key]||key} data={val} />
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-5 text-muted">
                        <div style={{fontSize:48,opacity:0.2}} className="mb-2">&#128269;</div>
                        <p>No scan results yet</p>
                        <small>Click scan buttons on the asset to start</small>
                      </div>
                    )}
                  </Card.Body>
                </>
              ) : (
                <Card.Body className="text-center py-5 text-muted">
                  <div style={{fontSize:48,opacity:0.2}} className="mb-2">&#128196;</div>
                  <p>Select an asset to view scan results</p>
                  <small>Click on any asset in the left panel</small>
                </Card.Body>
              )}
            </Card>
          </Col>
        </Row>
      </Container>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .accordion-button:not(.collapsed) { background-color: #f8f9fa; color: #212529; }
        .accordion-button:focus { box-shadow: none; border-color: #dee2e6; }
        .list-group-item.active { background-color: #e7f1ff; border-color: #b6d4fe; color: #1e293b; }
        .list-group-item.active .text-muted { color: #6c757d !important; }
        .list-group-item.active strong { color: #0d6efd; }
      `}</style>
    </div>
  );
}
