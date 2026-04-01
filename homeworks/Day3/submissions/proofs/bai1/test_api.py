"""
Bai 1 - Full API Test Script for Mini EASM
Run: python test_api.py
"""
import requests
import time
import json

BASE = "http://localhost:8080"

def pp(label, resp):
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"  Status: {resp.status_code}")
    print(f"{'='*60}")
    try:
        print(json.dumps(resp.json(), indent=2, ensure_ascii=False))
    except:
        print(resp.text)

# ── Health Check ──
r = requests.get(f"{BASE}/health")
pp("Health Check", r)

# ── Create Assets ──
r = requests.post(f"{BASE}/assets", json={"name": "google.com", "type": "domain"})
pp("Create Domain Asset", r)
DOMAIN_ID = r.json()["id"]

r = requests.post(f"{BASE}/assets", json={"name": "127.0.0.1", "type": "ip"})
pp("Create IP Asset", r)
IP_ID = r.json()["id"]

r = requests.post(f"{BASE}/assets", json={"name": "8.8.8.8", "type": "ip"})
pp("Create Public IP Asset (for safety test)", r)
PUBLIC_ID = r.json()["id"]

# ── List Assets ──
r = requests.get(f"{BASE}/assets")
pp("List Assets", r)

# ── Start Scans ──
scans = {}
for asset_id, scan_type, label in [
    (DOMAIN_ID, "dns",  "DNS Scan"),
    (DOMAIN_ID, "whois","WHOIS Scan"),
    (IP_ID,     "ip",   "IP Scan"),
    (IP_ID,     "port", "Port Scan (localhost)"),
    (DOMAIN_ID, "ssl",  "SSL Scan (bonus)"),
    (DOMAIN_ID, "tech", "Tech Scan (bonus)"),
]:
    r = requests.post(f"{BASE}/assets/{asset_id}/scan", json={"scan_type": scan_type})
    pp(f"Start {label}", r)
    scans[label] = r.json().get("id")

# ── Safety Check: Port scan on public IP ──
r = requests.post(f"{BASE}/assets/{PUBLIC_ID}/scan", json={"scan_type": "port"})
pp("Start Port Scan on PUBLIC IP (should fail later)", r)
safety_job = r.json().get("id")

# ── Wait for scans ──
print("\n\nWaiting 12 seconds for scans to complete...\n")
time.sleep(12)

# ── Check Job Statuses ──
for label, job_id in scans.items():
    if not job_id:
        continue
    r = requests.get(f"{BASE}/scan-jobs/{job_id}")
    status = r.json().get("status", "?")
    results = r.json().get("results", 0)
    error = r.json().get("error", "")
    icon = "PASS" if status == "completed" else "WARN" if status == "partial" else "FAIL"
    print(f"  [{icon}] {label:30s} status={status:10s} results={results}  {error}")

# -- Safety Check Result --
if safety_job:
    r = requests.get(f"{BASE}/scan-jobs/{safety_job}")
    status = r.json().get("status", "?")
    error = r.json().get("error", "")
    icon = "PASS" if status == "failed" else "FAIL - SHOULD HAVE FAILED"
    print(f"  [{icon}] {'Port Scan PUBLIC IP':30s} status={status:10s} error={error}")

# ── Get Scan Results ──
for label, job_id in scans.items():
    if not job_id:
        continue
    r = requests.get(f"{BASE}/scan-jobs/{job_id}/results")
    pp(f"Results: {label}", r)

# ── Aggregate Results ──
r = requests.get(f"{BASE}/assets/{DOMAIN_ID}/results")
pp("ALL Results for Domain (aggregate)", r)

r = requests.get(f"{BASE}/assets/{IP_ID}/results")
pp("ALL Results for IP (aggregate)", r)

# ── List Scans for Domain ──
r = requests.get(f"{BASE}/assets/{DOMAIN_ID}/scans")
pp("List all scans for Domain", r)

print("\n\nTest complete!")
