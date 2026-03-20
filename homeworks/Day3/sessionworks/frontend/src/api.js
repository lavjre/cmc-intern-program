const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function handleResponse(res) {
  if (res.ok) return res.status === 204 ? null : res.json();
  let message;
  try {
    const body = await res.json();
    message = body.error || JSON.stringify(body);
  } catch {
    message = await res.text();
  }
  throw new Error(message || `HTTP ${res.status}`);
}

export async function getAssets() {
  const res = await fetch(`${API_URL}/assets`);
  return handleResponse(res);
}

export async function createAsset(payload) {
  const res = await fetch(`${API_URL}/assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

export async function deleteAsset(id) {
  const res = await fetch(`${API_URL}/assets/${id}`, { method: "DELETE" });
  return handleResponse(res);
}

export async function startScan(assetId, scanType) {
  const res = await fetch(`${API_URL}/assets/${assetId}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_type: scanType }),
  });
  return handleResponse(res);
}

export async function getScanJob(jobId) {
  const res = await fetch(`${API_URL}/scan-jobs/${jobId}`);
  return handleResponse(res);
}

export async function getScanResults(jobId) {
  const res = await fetch(`${API_URL}/scan-jobs/${jobId}/results`);
  return handleResponse(res);
}

export async function getAssetResults(assetId) {
  const res = await fetch(`${API_URL}/assets/${assetId}/results`);
  return handleResponse(res);
}