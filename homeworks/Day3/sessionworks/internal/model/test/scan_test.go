package test

import (
	"testing"

	"mini-asm/internal/model"
)

func TestIsValidScanType(t *testing.T) {
	tests := []struct {
		name  string
		input model.ScanType
		want  bool
	}{
		{"all", model.ScanTypeAll, true},
		{"dns", model.ScanTypeDNS, true},
		{"whois", model.ScanTypeWHOIS, true},
		{"subdomain", model.ScanTypeSubdomain, true},
		{"port", model.ScanTypePort, true},
		{"asn", model.ScanTypeASN, true},
		{"cert_trans", model.ScanTypeCertTrans, true},
		{"ssl", model.ScanTypeSSL, true},
		{"ip", model.ScanTypeIP, true},
		{"tech", model.ScanTypeTech, true},
		{"invalid", model.ScanType("invalid"), false},
		{"empty", model.ScanType(""), false},
		{"uppercase DNS", model.ScanType("DNS"), false},
		{"nmap", model.ScanType("nmap"), false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := model.IsValidScanType(tt.input); got != tt.want {
				t.Errorf("IsValidScanType(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestIsValidScanStatus(t *testing.T) {
	tests := []struct {
		name  string
		input model.ScanStatus
		want  bool
	}{
		{"pending", model.ScanStatusPending, true},
		{"running", model.ScanStatusRunning, true},
		{"completed", model.ScanStatusCompleted, true},
		{"failed", model.ScanStatusFailed, true},
		{"partial", model.ScanStatusPartial, true},
		{"invalid", model.ScanStatus("invalid"), false},
		{"empty", model.ScanStatus(""), false},
		{"cancelled", model.ScanStatus("cancelled"), false},
		{"COMPLETED", model.ScanStatus("COMPLETED"), false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := model.IsValidScanStatus(tt.input); got != tt.want {
				t.Errorf("IsValidScanStatus(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestScanTypeConstants(t *testing.T) {
	expected := map[model.ScanType]string{
		model.ScanTypeAll:       "all",
		model.ScanTypeSubdomain: "subdomain",
		model.ScanTypeDNS:       "dns",
		model.ScanTypeWHOIS:     "whois",
		model.ScanTypePort:      "port",
		model.ScanTypeASN:       "asn",
		model.ScanTypeCertTrans: "cert_trans",
		model.ScanTypeSSL:       "ssl",
		model.ScanTypeIP:        "ip",
		model.ScanTypeTech:      "tech",
	}
	for constant, value := range expected {
		if string(constant) != value {
			t.Errorf("constant %v = %q, want %q", constant, string(constant), value)
		}
	}
}

func TestScanStatusConstants(t *testing.T) {
	expected := map[model.ScanStatus]string{
		model.ScanStatusPending:   "pending",
		model.ScanStatusRunning:   "running",
		model.ScanStatusCompleted: "completed",
		model.ScanStatusFailed:    "failed",
		model.ScanStatusPartial:   "partial",
	}
	for constant, value := range expected {
		if string(constant) != value {
			t.Errorf("constant %v = %q, want %q", constant, string(constant), value)
		}
	}
}
