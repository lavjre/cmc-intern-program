import axios from "axios";

const API_BASE = "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ── Health ──────────────────────────────────────────────────────────────────

export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

// ── Assets ──────────────────────────────────────────────────────────────────
// Backend returns: { data: [...], total, page, page_size, total_pages }

export const assetsAPI = {
  create: async (data) => {
    const response = await api.post("/assets", data);
    return response.data;
  },
  list: async (params = {}) => {
    const response = await api.get("/assets", { params });
    return response.data;
  },
  get: async (id) => {
    const response = await api.get(`/assets/${id}`);
    return response.data;
  },
  update: async (id, data) => {
    const response = await api.put(`/assets/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    await api.delete(`/assets/${id}`);
  },
};

// ── Scanning ─────────────────────────────────────────────────────────────────
// Backend listJobs returns a raw array; we wrap it for the UI.

export const scanningAPI = {
  startScan: async (assetId, scanType) => {
    const response = await api.post(`/assets/${assetId}/scan`, {
      scan_type: scanType,
    });
    return response.data;
  },
  listJobs: async (assetId, params = {}) => {
    const response = await api.get(`/assets/${assetId}/scans`, { params });
    // Backend now returns paginated object; fall back for bare array (legacy)
    if (Array.isArray(response.data)) return { data: response.data };
    return response.data;
  },
  demoSyncVsAsync: async (assetId) => {
    const response = await api.post(`/assets/${assetId}/scan/demo`);
    return response.data;
  },
  getJob: async (jobId) => {
    const response = await api.get(`/scan-jobs/${jobId}`);
    return response.data;
  },
  getResults: async (jobId) => {
    const response = await api.get(`/scan-jobs/${jobId}/results`);
    return response.data;
  },
};

// ── Results ───────────────────────────────────────────────────────────────────
// DNS and subdomains return raw arrays; WHOIS returns a single object.

export const resultsAPI = {
  getAll: async (assetId) => {
    const response = await api.get(`/assets/${assetId}/results`);
    return response.data;
  },
  getSubdomains: async (assetId, params = {}) => {
    const response = await api.get(`/assets/${assetId}/subdomains`, { params });
    const items = Array.isArray(response.data) ? response.data : [];
    return { data: items, total: items.length, total_pages: 1, page: 1 };
  },
  getDNS: async (assetId, params = {}) => {
    const response = await api.get(`/assets/${assetId}/dns`, { params });
    const items = Array.isArray(response.data) ? response.data : [];
    return { data: items, total: items.length, total_pages: 1, page: 1 };
  },
  getWHOIS: async (assetId) => {
    const response = await api.get(`/assets/${assetId}/whois`);
    return response.data;
  },
  getIP: async (assetId) => {
    const response = await api.get(`/assets/${assetId}/ip`);
    return Array.isArray(response.data) ? response.data : [];
  },
  getPorts: async (assetId) => {
    const response = await api.get(`/assets/${assetId}/ports`);
    return Array.isArray(response.data) ? response.data : [];
  },
  getSSL: async (assetId) => {
    const response = await api.get(`/assets/${assetId}/ssl`);
    return Array.isArray(response.data) ? response.data : [];
  },
  getTech: async (assetId) => {
    const response = await api.get(`/assets/${assetId}/tech`);
    return Array.isArray(response.data) ? response.data : [];
  },
};

// ── 6.2 Tags ──────────────────────────────────────────────────────────────────

export const tagsAPI = {
  getByAsset: async (assetId) => {
    const r = await api.get(`/assets/${assetId}/tags`);
    return r.data.tags || [];
  },
  add: async (assetId, tag) => {
    const r = await api.post(`/assets/${assetId}/tags`, { tag });
    return r.data;
  },
  remove: async (assetId, tag) => {
    await api.delete(`/assets/${assetId}/tags/${encodeURIComponent(tag)}`);
  },
  listAll: async () => {
    const r = await api.get("/tags");
    return r.data.tags || [];
  },
  getAssetsByTag: async (tag) => {
    const r = await api.get(`/tags/${encodeURIComponent(tag)}/assets`);
    return r.data.data || [];
  },
};

// ── 6.1 Schedules ─────────────────────────────────────────────────────────────

export const schedulesAPI = {
  list: async () => {
    const r = await api.get("/schedules");
    return r.data.data || [];
  },
  create: async (data) => {
    const r = await api.post("/schedules", data);
    return r.data;
  },
  delete: async (id) => {
    await api.delete(`/schedules/${id}`);
  },
  toggle: async (id, enabled) => {
    const r = await api.patch(`/schedules/${id}`, { enabled });
    return r.data;
  },
};

// ── 6.3 Alerts ────────────────────────────────────────────────────────────────

export const alertsAPI = {
  list: async (resolved) => {
    const params = resolved !== undefined ? { resolved } : {};
    const r = await api.get("/alerts", { params });
    return r.data;
  },
  count: async () => {
    const r = await api.get("/alerts/count");
    return r.data.unresolved || 0;
  },
  resolve: async (id) => {
    const r = await api.post(`/alerts/${id}/resolve`);
    return r.data;
  },
};

// ── 6.4 Scan Comparison ───────────────────────────────────────────────────────

export const compareAPI = {
  compare: async (assetId, job1, job2) => {
    const r = await api.get(`/assets/${assetId}/compare`, { params: { job1, job2 } });
    return r.data;
  },
};

// ── 6.5 Export ────────────────────────────────────────────────────────────────

export const exportAPI = {
  assets: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return `${API_BASE}/assets/export${q ? "?" + q : ""}`;
  },
  scanResults: (assetId) => `${API_BASE}/assets/${assetId}/results/export`,
};

// ── Error interceptor ────────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  },
);

export default api;
