-- Bang luu ket qua SSL scan
CREATE TABLE IF NOT EXISTS ssl_scan_results (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL,
    scan_job_id UUID NOT NULL,
    domain TEXT NOT NULL,
    cert_json JSONB,
    conn_json JSONB,
    grade TEXT DEFAULT '',
    issues_json JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ssl_scan_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ssl_scan_job FOREIGN KEY (scan_job_id) REFERENCES scan_jobs(id) ON DELETE CASCADE
);

-- Bang luu ket qua Tech scan
CREATE TABLE IF NOT EXISTS tech_scan_results (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL,
    scan_job_id UUID NOT NULL,
    domain TEXT NOT NULL,
    tech_json JSONB,
    headers_json JSONB,
    meta_tags_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tech_scan_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_tech_scan_job FOREIGN KEY (scan_job_id) REFERENCES scan_jobs(id) ON DELETE CASCADE
);
--bai1
