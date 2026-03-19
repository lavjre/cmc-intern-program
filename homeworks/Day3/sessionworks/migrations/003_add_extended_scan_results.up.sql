-- Bang luu ket qua IP scan
CREATE TABLE IF NOT EXISTS ip_scan_results (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL,
    scan_job_id UUID NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    geo_json JSONB,
    asn_json JSONB,
    reverse_dns VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ip_scan_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_ip_scan_job FOREIGN KEY (scan_job_id) REFERENCES scan_jobs(id) ON DELETE CASCADE
);

-- Bang luu ket qua Port scan
CREATE TABLE IF NOT EXISTS port_scan_results (
    id UUID PRIMARY KEY,
    asset_id UUID NOT NULL,
    scan_job_id UUID NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    open_ports_json JSONB DEFAULT '[]'::jsonb,
    closed_ports INTEGER DEFAULT 0,
    total_scanned INTEGER DEFAULT 0,
    scan_duration_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_port_scan_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    CONSTRAINT fk_port_scan_job FOREIGN KEY (scan_job_id) REFERENCES scan_jobs(id) ON DELETE CASCADE
);
--bai1
