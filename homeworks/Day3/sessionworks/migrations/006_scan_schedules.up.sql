-- 6.1 Scheduled Scans
CREATE TABLE IF NOT EXISTS scan_schedules (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id       UUID         NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    scan_type      VARCHAR(50)  NOT NULL,
    interval_hours INT          NOT NULL DEFAULT 24,
    next_run       TIMESTAMP WITH TIME ZONE,
    enabled        BOOLEAN      NOT NULL DEFAULT true,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_schedules_asset_id  ON scan_schedules(asset_id);
CREATE INDEX IF NOT EXISTS idx_scan_schedules_next_run  ON scan_schedules(next_run) WHERE enabled = true;
