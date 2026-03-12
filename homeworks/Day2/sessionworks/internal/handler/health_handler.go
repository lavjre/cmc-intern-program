package handler

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	startTime time.Time
	db        *sql.DB // Optional: Add database connection for DB health check
}

// NewHealthHandler creates a new health check handler
//
//	func NewHealthHandler() *HealthHandler {
//		return &HealthHandler{
//			startTime: time.Now(),
//		}
//	}
//
// bai 5
func NewHealthHandler(db *sql.DB) *HealthHandler {
	return &HealthHandler{
		startTime: time.Now(),
		db:        db,
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status    string        `json:"status"`
	Message   string        `json:"message"`
	Uptime    time.Duration `json:"uptime_seconds"`
	Timestamp time.Time     `json:"timestamp"`
}

// Check handles GET /health
func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if err := h.db.Ping(); err != nil {
		w.WriteHeader(http.StatusServiceUnavailable)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "degraded",
			"database": map[string]string{
				"status": "disconnected",
			},
			"timestamp": time.Now().Format(time.RFC3339),
		})
		return
	}

	stats := h.db.Stats()
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
		"database": map[string]interface{}{
			"status":           "connected",
			"open_connections": stats.OpenConnections,
			"in_use":           stats.InUse,
			"idle":             stats.Idle,
			"max_open":         stats.MaxOpenConnections,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

/*
🎓 NOTES:

Refactored từ Buổi 1:
- Buổi 1: Health check logic trong main.go
- Buổi 2: Extracted to separate handler

Benefits:
- Consistent with other handlers
- Can add more health checks (database, etc.) in Buổi 3
- Reusable and testable
*/
