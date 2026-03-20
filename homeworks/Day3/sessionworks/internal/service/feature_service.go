package service

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"log"
	"strings"
	"time"

	"mini-asm/internal/model"
	"mini-asm/internal/storage"

	"github.com/google/uuid"
)

// FeatureService handles the bonus EASM features:
//   6.1 Scheduled Scans
//   6.2 Asset Tags
//   6.3 Alerts / Notifications
//   6.4 Scan Comparison
//   6.5 Export Reports
type FeatureService struct {
	store       storage.Storage
	scanStore   storage.ScanStorage
	featureStore storage.FeatureStorage
	scanService *ScanService
}

func NewFeatureService(
	store storage.Storage,
	scanStore storage.ScanStorage,
	featureStore storage.FeatureStorage,
	scanService *ScanService,
) *FeatureService {
	return &FeatureService{
		store:        store,
		scanStore:    scanStore,
		featureStore: featureStore,
		scanService:  scanService,
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.2 Asset Tags
// ─────────────────────────────────────────────────────────────────────────────

func (f *FeatureService) AddTag(assetID, tag string) error {
	tag = strings.ToLower(strings.TrimSpace(tag))
	if tag == "" {
		return fmt.Errorf("tag cannot be empty")
	}
	if len(tag) > 50 {
		return fmt.Errorf("tag too long (max 50 characters)")
	}
	if _, err := f.store.GetByID(assetID); err != nil {
		return fmt.Errorf("asset not found: %w", err)
	}
	return f.featureStore.AddTag(assetID, tag)
}

func (f *FeatureService) RemoveTag(assetID, tag string) error {
	return f.featureStore.RemoveTag(assetID, tag)
}

func (f *FeatureService) GetTagsByAsset(assetID string) ([]string, error) {
	return f.featureStore.GetTagsByAsset(assetID)
}

func (f *FeatureService) GetAssetsByTag(tag string) ([]*model.Asset, error) {
	return f.featureStore.GetAssetsByTag(tag)
}

func (f *FeatureService) GetAllTags() ([]string, error) {
	return f.featureStore.GetAllTags()
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.1 Scheduled Scans
// ─────────────────────────────────────────────────────────────────────────────

func (f *FeatureService) CreateSchedule(assetID string, scanType model.ScanType, intervalHours int) (*model.ScanSchedule, error) {
	if _, err := f.store.GetByID(assetID); err != nil {
		return nil, fmt.Errorf("asset not found: %w", err)
	}
	if !model.IsValidScanType(scanType) {
		return nil, fmt.Errorf("invalid scan type: %s", scanType)
	}
	if intervalHours < 1 {
		return nil, fmt.Errorf("interval_hours must be >= 1")
	}
	now := time.Now()
	nextRun := now.Add(time.Duration(intervalHours) * time.Hour)
	sc := &model.ScanSchedule{
		ID:            uuid.New().String(),
		AssetID:       assetID,
		ScanType:      scanType,
		IntervalHours: intervalHours,
		NextRun:       &nextRun,
		Enabled:       true,
		CreatedAt:     now,
	}
	if err := f.featureStore.CreateSchedule(sc); err != nil {
		return nil, err
	}
	return sc, nil
}

func (f *FeatureService) GetSchedules() ([]*model.ScanSchedule, error) {
	return f.featureStore.GetSchedules()
}

func (f *FeatureService) GetSchedulesByAsset(assetID string) ([]*model.ScanSchedule, error) {
	return f.featureStore.GetSchedulesByAsset(assetID)
}

func (f *FeatureService) DeleteSchedule(id string) error {
	return f.featureStore.DeleteSchedule(id)
}

func (f *FeatureService) ToggleSchedule(id string, enabled bool) error {
	schedules, err := f.featureStore.GetSchedules()
	if err != nil {
		return err
	}
	for _, sc := range schedules {
		if sc.ID == id {
			sc.Enabled = enabled
			return f.featureStore.UpdateSchedule(sc)
		}
	}
	return fmt.Errorf("schedule not found")
}

// RunDueSchedules is called by the background scheduler. It fetches all
// schedules whose next_run time has passed and fires a scan for each.
func (f *FeatureService) RunDueSchedules() {
	schedules, err := f.featureStore.GetDueSchedules()
	if err != nil {
		log.Printf("[scheduler] error fetching due schedules: %v", err)
		return
	}
	for _, sc := range schedules {
		log.Printf("[scheduler] running scheduled scan: asset=%s type=%s", sc.AssetID, sc.ScanType)
		_, err := f.scanService.StartScan(sc.AssetID, sc.ScanType)
		if err != nil {
			log.Printf("[scheduler] scan failed: %v", err)
		}
		// advance next_run
		next := time.Now().Add(time.Duration(sc.IntervalHours) * time.Hour)
		sc.NextRun = &next
		if err := f.featureStore.UpdateSchedule(sc); err != nil {
			log.Printf("[scheduler] failed to update schedule: %v", err)
		}
	}
}

// StartScheduler launches a background goroutine that checks for due schedules
// every minute. Call once from main.go.
func (f *FeatureService) StartScheduler() {
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		log.Println("[scheduler] started — checking every 60 s")
		for range ticker.C {
			f.RunDueSchedules()
		}
	}()
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.3 Alerts
// ─────────────────────────────────────────────────────────────────────────────

func (f *FeatureService) createAlert(assetID, scanJobID string, alertType model.AlertType, severity model.AlertSeverity, message string) {
	a := &model.Alert{
		ID:        uuid.New().String(),
		AssetID:   assetID,
		ScanJobID: scanJobID,
		AlertType: alertType,
		Severity:  severity,
		Message:   message,
		CreatedAt: time.Now(),
	}
	if err := f.featureStore.CreateAlert(a); err != nil {
		log.Printf("[alerts] failed to create alert: %v", err)
	}
}

// CheckScanAlerts inspects results after a completed scan job and generates
// alerts for interesting findings.
func (f *FeatureService) CheckScanAlerts(jobID, assetID string, scanType model.ScanType) {
	switch scanType {
	case model.ScanTypeSubdomain:
		subs, _ := f.scanStore.GetSubdomainsByScan(jobID)
		if len(subs) == 0 {
			f.createAlert(assetID, jobID, model.AlertTypeScanEmpty, model.AlertSeverityInfo,
				"Subdomain scan returned no results")
		} else if len(subs) > 0 {
			f.createAlert(assetID, jobID, model.AlertTypeNewSubdomain, model.AlertSeverityInfo,
				fmt.Sprintf("Discovered %d subdomains", len(subs)))
		}

	case model.ScanTypePort:
		ports, _ := f.scanStore.GetPortScanResultsByScan(jobID)
		if len(ports) == 0 {
			f.createAlert(assetID, jobID, model.AlertTypeScanEmpty, model.AlertSeverityInfo,
				"Port scan returned no results")
		} else {
			f.createAlert(assetID, jobID, model.AlertTypePortOpen, model.AlertSeverityWarning,
				fmt.Sprintf("Port scan found %d result(s) — review open ports", len(ports)))
		}

	case model.ScanTypeSSL:
		results, _ := f.scanStore.GetSSLScanResultsByScan(jobID)
		if len(results) == 0 {
			f.createAlert(assetID, jobID, model.AlertTypeScanEmpty, model.AlertSeverityInfo,
				"SSL scan returned no results")
		} else {
			for _, r := range results {
				if r.Grade != "" && (r.Grade == "F" || r.Grade == "T") {
					f.createAlert(assetID, jobID, model.AlertTypeSSLExpiry, model.AlertSeverityCritical,
						fmt.Sprintf("SSL certificate for %s has critical issues (grade: %s)", r.Domain, r.Grade))
				} else if r.Grade != "" && strings.HasPrefix(r.Grade, "C") {
					f.createAlert(assetID, jobID, model.AlertTypeSSLExpiry, model.AlertSeverityWarning,
						fmt.Sprintf("SSL certificate for %s may have issues (grade: %s)", r.Domain, r.Grade))
				}
			}
		}

	case model.ScanTypeDNS:
		records, _ := f.scanStore.GetDNSRecordsByScan(jobID)
		if len(records) > 0 {
			f.createAlert(assetID, jobID, model.AlertTypeNewDNS, model.AlertSeverityInfo,
				fmt.Sprintf("DNS scan found %d records", len(records)))
		}
	}
}

func (f *FeatureService) GetAlerts(resolvedOnly *bool) ([]*model.Alert, error) {
	return f.featureStore.GetAlerts(resolvedOnly)
}

func (f *FeatureService) GetAlertsByAsset(assetID string, resolvedOnly *bool) ([]*model.Alert, error) {
	return f.featureStore.GetAlertsByAsset(assetID, resolvedOnly)
}

func (f *FeatureService) ResolveAlert(id string) error {
	return f.featureStore.ResolveAlert(id)
}

func (f *FeatureService) CountUnresolvedAlerts() (int, error) {
	return f.featureStore.CountUnresolvedAlerts()
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.4 Scan Comparison
// ─────────────────────────────────────────────────────────────────────────────

// CompareScan compares the results of two scan jobs and returns added/removed items.
func (f *FeatureService) CompareScan(job1ID, job2ID string) (*model.ScanDiff, error) {
	job1, err := f.scanStore.GetScanJob(job1ID)
	if err != nil {
		return nil, fmt.Errorf("job1 not found: %w", err)
	}
	job2, err := f.scanStore.GetScanJob(job2ID)
	if err != nil {
		return nil, fmt.Errorf("job2 not found: %w", err)
	}
	if job1.ScanType != job2.ScanType {
		return nil, fmt.Errorf("scan types differ: %s vs %s", job1.ScanType, job2.ScanType)
	}
	if job1.AssetID != job2.AssetID {
		return nil, fmt.Errorf("jobs belong to different assets")
	}

	diff := &model.ScanDiff{Job1ID: job1ID, Job2ID: job2ID, ScanType: job1.ScanType}

	switch job1.ScanType {
	case model.ScanTypeDNS:
		diff = f.compareDNS(diff, job1ID, job2ID)
	case model.ScanTypeSubdomain:
		diff = f.compareSubdomains(diff, job1ID, job2ID)
	case model.ScanTypePort:
		diff = f.comparePorts(diff, job1ID, job2ID)
	default:
		diff.Summary = fmt.Sprintf("Comparison not supported for scan type %s", job1.ScanType)
	}
	return diff, nil
}

func (f *FeatureService) compareDNS(diff *model.ScanDiff, job1, job2 string) *model.ScanDiff {
	r1, _ := f.scanStore.GetDNSRecordsByScan(job1)
	r2, _ := f.scanStore.GetDNSRecordsByScan(job2)

	set1 := make(map[string]*model.DNSRecord)
	set2 := make(map[string]*model.DNSRecord)
	for _, r := range r1 {
		set1[r.RecordType+"|"+r.Name+"|"+r.Value] = r
	}
	for _, r := range r2 {
		set2[r.RecordType+"|"+r.Name+"|"+r.Value] = r
	}
	for k, r := range set2 {
		if _, ok := set1[k]; !ok {
			diff.Added = append(diff.Added, r)
		}
	}
	for k, r := range set1 {
		if _, ok := set2[k]; !ok {
			diff.Removed = append(diff.Removed, r)
		}
	}
	diff.Summary = fmt.Sprintf("DNS: +%d added, -%d removed", len(diff.Added), len(diff.Removed))
	return diff
}

func (f *FeatureService) compareSubdomains(diff *model.ScanDiff, job1, job2 string) *model.ScanDiff {
	r1, _ := f.scanStore.GetSubdomainsByScan(job1)
	r2, _ := f.scanStore.GetSubdomainsByScan(job2)

	set1 := make(map[string]*model.Subdomain)
	set2 := make(map[string]*model.Subdomain)
	for _, s := range r1 {
		set1[s.Name] = s
	}
	for _, s := range r2 {
		set2[s.Name] = s
	}
	for k, s := range set2 {
		if _, ok := set1[k]; !ok {
			diff.Added = append(diff.Added, s)
		}
	}
	for k, s := range set1 {
		if _, ok := set2[k]; !ok {
			diff.Removed = append(diff.Removed, s)
		}
	}
	diff.Summary = fmt.Sprintf("Subdomains: +%d new, -%d removed", len(diff.Added), len(diff.Removed))
	return diff
}

func (f *FeatureService) comparePorts(diff *model.ScanDiff, job1, job2 string) *model.ScanDiff {
	r1, _ := f.scanStore.GetPortScanResultsByScan(job1)
	r2, _ := f.scanStore.GetPortScanResultsByScan(job2)

	// We represent port results by their JSON blob key
	key := func(r *model.PortScanResult) string { return r.AssetID + "|" + r.ScanJobID }
	set1 := make(map[string]*model.PortScanResult)
	set2 := make(map[string]*model.PortScanResult)
	for _, r := range r1 {
		set1[key(r)] = r
	}
	for _, r := range r2 {
		set2[key(r)] = r
	}
	for k, r := range set2 {
		if _, ok := set1[k]; !ok {
			diff.Added = append(diff.Added, r)
		}
	}
	for k, r := range set1 {
		if _, ok := set2[k]; !ok {
			diff.Removed = append(diff.Removed, r)
		}
	}
	diff.Summary = fmt.Sprintf("Ports: +%d new result(s), -%d removed", len(diff.Added), len(diff.Removed))
	return diff
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.5 Export Reports
// ─────────────────────────────────────────────────────────────────────────────

// ExportAssetsCSV returns a CSV byte slice of all assets matching the given params.
func (f *FeatureService) ExportAssetsCSV(params storage.QueryParams) ([]byte, error) {
	params.PageSize = 10000
	params.Page = 1
	result, err := f.store.GetAll(params)
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)
	_ = w.Write([]string{"id", "name", "type", "status", "created_at", "updated_at"})
	for _, a := range result.Data {
		_ = w.Write([]string{
			a.ID, a.Name, a.Type, a.Status,
			a.CreatedAt.Format(time.RFC3339),
			a.UpdatedAt.Format(time.RFC3339),
		})
	}
	w.Flush()
	return buf.Bytes(), w.Error()
}

// ExportScanResultsCSV returns a CSV of DNS records, subdomains, and scan jobs
// for the given asset.
func (f *FeatureService) ExportScanResultsCSV(assetID string) ([]byte, error) {
	if _, err := f.store.GetByID(assetID); err != nil {
		return nil, fmt.Errorf("asset not found: %w", err)
	}

	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	// Scan jobs
	_ = w.Write([]string{"--- SCAN JOBS ---"})
	_ = w.Write([]string{"id", "scan_type", "status", "started_at", "ended_at", "results", "error"})
	jobs, _ := f.scanStore.ListScanJobsByAsset(assetID)
	for _, j := range jobs {
		ended := ""
		if j.EndedAt != nil {
			ended = j.EndedAt.Format(time.RFC3339)
		}
		_ = w.Write([]string{j.ID, string(j.ScanType), string(j.Status),
			j.StartedAt.Format(time.RFC3339), ended, fmt.Sprint(j.Results), j.Error})
	}

	// DNS records
	_ = w.Write([]string{})
	_ = w.Write([]string{"--- DNS RECORDS ---"})
	_ = w.Write([]string{"id", "record_type", "name", "value", "ttl", "created_at"})
	dns, _ := f.scanStore.GetDNSRecordsByAsset(assetID)
	for _, r := range dns {
		_ = w.Write([]string{r.ID, r.RecordType, r.Name, r.Value, fmt.Sprint(r.TTL), r.CreatedAt.Format(time.RFC3339)})
	}

	// Subdomains
	_ = w.Write([]string{})
	_ = w.Write([]string{"--- SUBDOMAINS ---"})
	_ = w.Write([]string{"id", "name", "source", "is_active", "created_at"})
	subs, _ := f.scanStore.GetSubdomainsByAsset(assetID)
	for _, s := range subs {
		_ = w.Write([]string{s.ID, s.Name, s.Source, fmt.Sprint(s.IsActive), s.CreatedAt.Format(time.RFC3339)})
	}

	w.Flush()
	return buf.Bytes(), w.Error()
}
