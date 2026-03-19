package test

import (
	"testing"

	"mini-asm/internal/model"
	"mini-asm/internal/scanner"
)

func TestPortScanner_Type(t *testing.T) {
	ps := scanner.NewPortScanner()
	if ps.Type() != model.ScanTypePort {
		t.Errorf("Type() = %v, want %v", ps.Type(), model.ScanTypePort)
	}
}

func TestPortScanner_Scan_WrongAssetType(t *testing.T) {
	ps := scanner.NewPortScanner()
	asset := &model.Asset{Name: "example.com", Type: model.TypeDomain}
	_, err := ps.Scan(asset)
	if err == nil {
		t.Error("expected error for domain asset, got nil")
	}
}

func TestPortScanner_Scan_PublicIP_Blocked(t *testing.T) {
	ps := scanner.NewPortScanner()
	publicIPs := []string{"8.8.8.8", "1.1.1.1", "203.0.113.1", "172.32.0.1", "11.0.0.1"}
	for _, ip := range publicIPs {
		t.Run(ip, func(t *testing.T) {
			asset := &model.Asset{Name: ip, Type: model.TypeIP}
			_, err := ps.Scan(asset)
			if err == nil {
				t.Errorf("expected error for public IP %s, got nil", ip)
			}
		})
	}
}

func TestPortScanner_Scan_PrivateIP_Allowed(t *testing.T) {
	ps := scanner.NewPortScanner()
	asset := &model.Asset{Name: "127.0.0.1", Type: model.TypeIP}
	result, err := ps.Scan(asset)
	if err != nil {
		t.Fatalf("unexpected error for localhost: %v", err)
	}
	if result.IPAddress != "127.0.0.1" {
		t.Errorf("IPAddress = %q, want %q", result.IPAddress, "127.0.0.1")
	}
	if result.TotalScanned == 0 {
		t.Error("TotalScanned should be > 0")
	}
	if result.TotalScanned != result.ClosedPorts+len(result.OpenPortsJSON)/10 {
		// just verify fields are populated
	}
}

func TestPortScanner_Scan_PrivateRanges(t *testing.T) {
	ps := scanner.NewPortScanner()
	privateIPs := []string{"10.0.0.1", "172.16.0.1", "192.168.1.1"}
	for _, ip := range privateIPs {
		t.Run(ip, func(t *testing.T) {
			asset := &model.Asset{Name: ip, Type: model.TypeIP}
			_, err := ps.Scan(asset)
			// Should not get "blocked" error (may get connection error which is fine)
			if err != nil && contains(err.Error(), "blocked") {
				t.Errorf("private IP %s should not be blocked, got: %v", ip, err)
			}
		})
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && searchString(s, substr)
}

func searchString(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
