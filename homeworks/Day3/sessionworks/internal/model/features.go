package model

import "time"

// ── 6.2 Asset Tags ────────────────────────────────────────────────────────────

// AssetTag represents a label attached to an asset.
type AssetTag struct {
	AssetID   string    `json:"asset_id"`
	Tag       string    `json:"tag"`
	CreatedAt time.Time `json:"created_at"`
}

// ── 6.1 Scheduled Scans ───────────────────────────────────────────────────────

// ScanSchedule defines a recurring scan for a specific asset.
type ScanSchedule struct {
	ID            string     `json:"id"`
	AssetID       string     `json:"asset_id"`
	ScanType      ScanType   `json:"scan_type"`
	IntervalHours int        `json:"interval_hours"` // 1 / 6 / 12 / 24 / 168
	NextRun       *time.Time `json:"next_run"`
	Enabled       bool       `json:"enabled"`
	CreatedAt     time.Time  `json:"created_at"`
}

// ── 6.3 Alerts / Notifications ────────────────────────────────────────────────

type AlertType string
type AlertSeverity string

const (
	AlertTypeNewSubdomain AlertType = "new_subdomain"
	AlertTypePortOpen     AlertType = "port_open"
	AlertTypeSSLExpiry    AlertType = "ssl_expiry"
	AlertTypeScanEmpty    AlertType = "scan_empty"
	AlertTypeScanFailed   AlertType = "scan_failed"
	AlertTypeNewDNS       AlertType = "new_dns"
)

const (
	AlertSeverityInfo     AlertSeverity = "info"
	AlertSeverityWarning  AlertSeverity = "warning"
	AlertSeverityCritical AlertSeverity = "critical"
)

// Alert represents a detected issue or event for an asset.
type Alert struct {
	ID         string        `json:"id"`
	AssetID    string        `json:"asset_id"`
	ScanJobID  string        `json:"scan_job_id,omitempty"`
	AlertType  AlertType     `json:"alert_type"`
	Severity   AlertSeverity `json:"severity"`
	Message    string        `json:"message"`
	Resolved   bool          `json:"resolved"`
	CreatedAt  time.Time     `json:"created_at"`
}

// ── 6.4 Scan Comparison ───────────────────────────────────────────────────────

// ScanDiff holds the comparison result between two scan jobs.
type ScanDiff struct {
	Job1ID   string        `json:"job1_id"`
	Job2ID   string        `json:"job2_id"`
	ScanType ScanType      `json:"scan_type"`
	Added    []interface{} `json:"added"`
	Removed  []interface{} `json:"removed"`
	Summary  string        `json:"summary"`
}
