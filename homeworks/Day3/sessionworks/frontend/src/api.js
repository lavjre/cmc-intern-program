const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export async function getAssets() {
  const res = await fetch(`${API_URL}/assets`);
  if (!res.ok) throw new Error("Failed to fetch assets");
  return res.json();
}

export async function createAsset(payload) {
  const res = await fetch(`${API_URL}/assets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create asset");
  return res.json();
}

export async function deleteAsset(id) {
  const res = await fetch(`${API_URL}/assets/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete asset");
}

export async function startScan(assetId, scanType) {
  const res = await fetch(`${API_URL}/assets/${assetId}/scan`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_type: scanType }),
  });
  if (!res.ok) throw new Error("Failed to start scan");
  return res.json();
}

export async function getScanJob(jobId) {
  const res = await fetch(`${API_URL}/scan-jobs/${jobId}`);
  if (!res.ok) throw new Error("Failed to get scan job");
  return res.json();
}

export async function getScanResults(jobId) {
  const res = await fetch(`${API_URL}/scan-jobs/${jobId}/results`);
  if (!res.ok) throw new Error("Failed to get results");
  return res.json();
}

export async function getAssetResults(assetId) {
  const res = await fetch(`${API_URL}/assets/${assetId}/results`);
  if (!res.ok) throw new Error("Failed to get results");
  return res.json();
}