package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"mini-asm/internal/model"
	"mini-asm/internal/service"
	"mini-asm/internal/storage"
)

// FeatureHandler serves the bonus EASM features (tags, schedules, alerts, compare, export).
type FeatureHandler struct {
	fs *service.FeatureService
}

func NewFeatureHandler(fs *service.FeatureService) *FeatureHandler {
	return &FeatureHandler{fs: fs}
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.2 Tags
// ─────────────────────────────────────────────────────────────────────────────

// POST /assets/{id}/tags   body: {"tag":"production"}
func (h *FeatureHandler) AddTag(w http.ResponseWriter, r *http.Request) {
	assetID := r.PathValue("id")
	var req struct {
		Tag string `json:"tag"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Tag == "" {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "tag is required"})
		return
	}
	if err := h.fs.AddTag(assetID, req.Tag); err != nil {
		respondJSON(w, mapErrorToStatus(err), ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusCreated, map[string]string{"tag": req.Tag})
}

// DELETE /assets/{id}/tags/{tag}
func (h *FeatureHandler) RemoveTag(w http.ResponseWriter, r *http.Request) {
	assetID := r.PathValue("id")
	tag := r.PathValue("tag")
	if err := h.fs.RemoveTag(assetID, tag); err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GET /assets/{id}/tags
func (h *FeatureHandler) GetTags(w http.ResponseWriter, r *http.Request) {
	assetID := r.PathValue("id")
	tags, err := h.fs.GetTagsByAsset(assetID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if tags == nil {
		tags = []string{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"tags": tags})
}

// GET /tags           — list all distinct tags
// GET /tags/{tag}/assets — assets with a specific tag
func (h *FeatureHandler) ListTags(w http.ResponseWriter, r *http.Request) {
	tags, err := h.fs.GetAllTags()
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if tags == nil {
		tags = []string{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"tags": tags})
}

func (h *FeatureHandler) GetAssetsByTag(w http.ResponseWriter, r *http.Request) {
	tag := r.PathValue("tag")
	assets, err := h.fs.GetAssetsByTag(tag)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if assets == nil {
		assets = []*model.Asset{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"data": assets, "total": len(assets)})
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.1 Scheduled Scans
// ─────────────────────────────────────────────────────────────────────────────

// POST /schedules   body: {"asset_id":"..","scan_type":"dns","interval_hours":24}
func (h *FeatureHandler) CreateSchedule(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AssetID       string         `json:"asset_id"`
		ScanType      model.ScanType `json:"scan_type"`
		IntervalHours int            `json:"interval_hours"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid body"})
		return
	}
	if req.IntervalHours <= 0 {
		req.IntervalHours = 24
	}
	sc, err := h.fs.CreateSchedule(req.AssetID, req.ScanType, req.IntervalHours)
	if err != nil {
		respondJSON(w, mapErrorToStatus(err), ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusCreated, sc)
}

// GET /schedules
func (h *FeatureHandler) GetSchedules(w http.ResponseWriter, r *http.Request) {
	list, err := h.fs.GetSchedules()
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if list == nil {
		list = []*model.ScanSchedule{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"data": list, "total": len(list)})
}

// GET /assets/{id}/schedules
func (h *FeatureHandler) GetSchedulesByAsset(w http.ResponseWriter, r *http.Request) {
	assetID := r.PathValue("id")
	list, err := h.fs.GetSchedulesByAsset(assetID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if list == nil {
		list = []*model.ScanSchedule{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"data": list, "total": len(list)})
}

// DELETE /schedules/{id}
func (h *FeatureHandler) DeleteSchedule(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.fs.DeleteSchedule(id); err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// PATCH /schedules/{id}   body: {"enabled":false}
func (h *FeatureHandler) ToggleSchedule(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var req struct {
		Enabled bool `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid body"})
		return
	}
	if err := h.fs.ToggleSchedule(id, req.Enabled); err != nil {
		respondJSON(w, mapErrorToStatus(err), ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]bool{"enabled": req.Enabled})
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.3 Alerts
// ─────────────────────────────────────────────────────────────────────────────

// GET /alerts?resolved=false
func (h *FeatureHandler) GetAlerts(w http.ResponseWriter, r *http.Request) {
	filter := resolvedFilter(r)
	alerts, err := h.fs.GetAlerts(filter)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if alerts == nil {
		alerts = []*model.Alert{}
	}
	count, _ := h.fs.CountUnresolvedAlerts()
	respondJSON(w, http.StatusOK, map[string]interface{}{
		"data":               alerts,
		"total":              len(alerts),
		"unresolved_count":   count,
	})
}

// GET /assets/{id}/alerts
func (h *FeatureHandler) GetAlertsByAsset(w http.ResponseWriter, r *http.Request) {
	assetID := r.PathValue("id")
	filter := resolvedFilter(r)
	alerts, err := h.fs.GetAlertsByAsset(assetID, filter)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	if alerts == nil {
		alerts = []*model.Alert{}
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"data": alerts, "total": len(alerts)})
}

// POST /alerts/{id}/resolve
func (h *FeatureHandler) ResolveAlert(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if err := h.fs.ResolveAlert(id); err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "resolved"})
}

// GET /alerts/count
func (h *FeatureHandler) AlertCount(w http.ResponseWriter, r *http.Request) {
	count, err := h.fs.CountUnresolvedAlerts()
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]int{"unresolved": count})
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.4 Scan Comparison
// ─────────────────────────────────────────────────────────────────────────────

// GET /assets/{id}/compare?job1=<uuid>&job2=<uuid>
func (h *FeatureHandler) CompareScan(w http.ResponseWriter, r *http.Request) {
	job1 := r.URL.Query().Get("job1")
	job2 := r.URL.Query().Get("job2")
	if job1 == "" || job2 == "" {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "job1 and job2 query params required"})
		return
	}
	diff, err := h.fs.CompareScan(job1, job2)
	if err != nil {
		respondJSON(w, mapErrorToStatus(err), ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, diff)
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.5 Export
// ─────────────────────────────────────────────────────────────────────────────

// GET /assets/export?format=csv
func (h *FeatureHandler) ExportAssets(w http.ResponseWriter, r *http.Request) {
	params := storage.QueryParams{
		Type:   r.URL.Query().Get("type"),
		Status: r.URL.Query().Get("status"),
		Search: r.URL.Query().Get("search"),
	}
	data, err := h.fs.ExportAssetsCSV(params)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"assets_%s.csv\"",
		r.FormValue("filename")))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

// GET /assets/{id}/results/export?format=csv
func (h *FeatureHandler) ExportScanResults(w http.ResponseWriter, r *http.Request) {
	assetID := r.PathValue("id")
	data, err := h.fs.ExportScanResultsCSV(assetID)
	if err != nil {
		respondJSON(w, mapErrorToStatus(err), ErrorResponse{Error: err.Error()})
		return
	}
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition",
		fmt.Sprintf("attachment; filename=\"scan_results_%s.csv\"", assetID[:8]))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(data)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

func resolvedFilter(r *http.Request) *bool {
	v := r.URL.Query().Get("resolved")
	if v == "" {
		return nil
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return nil
	}
	return &b
}
