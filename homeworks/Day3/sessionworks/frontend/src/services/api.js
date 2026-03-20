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
  listJobs: async (assetId) => {
    const response = await api.get(`/assets/${assetId}/scans`);
    const jobs = Array.isArray(response.data) ? response.data : [];
    return { data: jobs };
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
