package test

import (
	"encoding/json"
	"testing"

	"mini-asm/internal/model"
	"mini-asm/internal/scanner"
)

func TestIPScanner_Type(t *testing.T) {
	s := scanner.NewIPScanner()
	if s.Type() != model.ScanTypeIP {
		t.Errorf("Type() = %v, want %v", s.Type(), model.ScanTypeIP)
	}
}

func TestIPScanner_Scan_WrongAssetType(t *testing.T) {
	s := scanner.NewIPScanner()
	asset := &model.Asset{Name: "example.com", Type: model.TypeDomain}
	_, err := s.Scan(asset)
	if err == nil {
		t.Error("expected error for domain asset, got nil")
	}
}

func TestIPScanner_Scan_Localhost(t *testing.T) {
	s := scanner.NewIPScanner()
	asset := &model.Asset{Name: "127.0.0.1", Type: model.TypeIP}
	result, err := s.Scan(asset)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.IPAddress != "127.0.0.1" {
		t.Errorf("IPAddress = %q, want %q", result.IPAddress, "127.0.0.1")
	}

	var geo map[string]interface{}
	if err := json.Unmarshal([]byte(result.GeoJSON), &geo); err != nil {
		t.Errorf("GeoJSON is not valid JSON: %v", err)
	}
	if _, ok := geo["country"]; !ok {
		t.Error("GeoJSON missing 'country' field")
	}

	var asn map[string]interface{}
	if err := json.Unmarshal([]byte(result.ASNJSON), &asn); err != nil {
		t.Errorf("ASNJSON is not valid JSON: %v", err)
	}
	if _, ok := asn["number"]; !ok {
		t.Error("ASNJSON missing 'number' field")
	}
}

func TestIPScanner_Scan_ServiceType(t *testing.T) {
	s := scanner.NewIPScanner()
	asset := &model.Asset{Name: "ssh", Type: model.TypeService}
	_, err := s.Scan(asset)
	if err == nil {
		t.Error("expected error for service asset, got nil")
	}
}
