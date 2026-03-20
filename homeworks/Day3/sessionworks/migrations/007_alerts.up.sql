-- 6.3 Alerts / Notifications
CREATE TABLE IF NOT EXISTS alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id    UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    scan_job_id UUID         REFERENCES scan_jobs(id) ON DELETE SET NULL,
    alert_type  VARCHAR(50)  NOT NULL,  -- e.g. "new_subdomain", "port_open", "ssl_expiry", "scan_empty"
    severity    VARCHAR(20)  NOT NULL DEFAULT 'info',  -- info / warning / critical
    message     TEXT         NOT NULL,
    resolved    BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_asset_id ON alerts(asset_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved  ON alerts(resolved);
