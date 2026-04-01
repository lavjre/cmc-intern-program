package test

import (
	"strings"
	"testing"

	"mini-asm/internal/model"
)

// TestScanTypeCategory tests scan category classification
func TestScanTypeCategory(t *testing.T) {
	tests := []struct {
		name     string
		scanType model.ScanType
		want     model.ScanCategory
	}{
		{"dns is passive", model.ScanTypeDNS, model.ScanCategoryPassive},
		{"whois is passive", model.ScanTypeWHOIS, model.ScanCategoryPassive},
		{"subdomain is passive", model.ScanTypeSubdomain, model.ScanCategoryPassive},
		{"all is passive", model.ScanTypeAll, model.ScanCategoryPassive},
		{"asn is passive", model.ScanTypeASN, model.ScanCategoryPassive},
		{"cert_trans is passive", model.ScanTypeCertTrans, model.ScanCategoryPassive},
		{"ip is passive", model.ScanTypeIP, model.ScanCategoryPassive},
		{"port is active", model.ScanTypePort, model.ScanCategoryActive},
		{"ssl is active", model.ScanTypeSSL, model.ScanCategoryActive},
		{"tech is active", model.ScanTypeTech, model.ScanCategoryActive},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.scanType.Category()
			if got != tt.want {
				t.Errorf("%s.Category() = %v, want %v", tt.scanType, got, tt.want)
			}
		})
	}
}

// TestScanTypeRequiresPermission tests permission checking
func TestScanTypeRequiresPermission(t *testing.T) {
	tests := []struct {
		name     string
		scanType model.ScanType
		want     bool
	}{
		{"dns - no permission needed", model.ScanTypeDNS, false},
		{"whois - no permission needed", model.ScanTypeWHOIS, false},
		{"subdomain - no permission needed", model.ScanTypeSubdomain, false},
		{"ip - no permission needed", model.ScanTypeIP, false},
		{"port - permission required", model.ScanTypePort, true},
		{"ssl - permission required", model.ScanTypeSSL, true},
		{"tech - permission required", model.ScanTypeTech, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.scanType.RequiresPermission()
			if got != tt.want {
				t.Errorf("%s.RequiresPermission() = %v, want %v", tt.scanType, got, tt.want)
			}
		})
	}
}

// TestScanTypeIsPassive tests passive scan detection
func TestScanTypeIsPassive(t *testing.T) {
	passiveScans := []model.ScanType{
		model.ScanTypeDNS, model.ScanTypeWHOIS, model.ScanTypeSubdomain,
		model.ScanTypeAll, model.ScanTypeASN, model.ScanTypeCertTrans, model.ScanTypeIP,
	}

	for _, scanType := range passiveScans {
		t.Run(string(scanType), func(t *testing.T) {
			if !scanType.IsPassive() {
				t.Errorf("%s.IsPassive() = false, want true", scanType)
			}
			if scanType.IsActive() {
				t.Errorf("%s.IsActive() = true, want false", scanType)
			}
		})
	}
}

// TestScanTypeIsActive tests active scan detection
func TestScanTypeIsActive(t *testing.T) {
	activeScans := []model.ScanType{model.ScanTypePort, model.ScanTypeSSL, model.ScanTypeTech}

	for _, scanType := range activeScans {
		t.Run(string(scanType), func(t *testing.T) {
			if !scanType.IsActive() {
				t.Errorf("%s.IsActive() = false, want true", scanType)
			}
			if scanType.IsPassive() {
				t.Errorf("%s.IsPassive() = true, want false", scanType)
			}
		})
	}
}

// TestScanTypeDescription tests description generation
func TestScanTypeDescription(t *testing.T) {
	tests := []struct {
		name     string
		scanType model.ScanType
		contains string
	}{
		{"dns mentions DNS", model.ScanTypeDNS, "DNS"},
		{"whois mentions WHOIS", model.ScanTypeWHOIS, "WHOIS"},
		{"port mentions permission", model.ScanTypePort, "permission"},
		{"ssl mentions permission", model.ScanTypeSSL, "permission"},
		{"all mentions passive", model.ScanTypeAll, "passive"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			desc := tt.scanType.Description()
			if desc == "" {
				t.Errorf("%s.Description() returned empty string", tt.scanType)
			}
			if !strings.Contains(strings.ToLower(desc), strings.ToLower(tt.contains)) {
				t.Errorf("%s.Description() = %q, want it to contain %q", tt.scanType, desc, tt.contains)
			}
		})
	}
}

// TestPassiveVsActiveClassification ensures every scan type is unambiguously
// either passive or active — never both, never neither.
func TestPassiveVsActiveClassification(t *testing.T) {
	allScanTypes := []model.ScanType{
		model.ScanTypeAll, model.ScanTypeDNS, model.ScanTypeWHOIS, model.ScanTypeSubdomain,
		model.ScanTypeCertTrans, model.ScanTypeASN, model.ScanTypeIP,
		model.ScanTypePort, model.ScanTypeSSL, model.ScanTypeTech,
	}

	for _, scanType := range allScanTypes {
		t.Run(string(scanType), func(t *testing.T) {
			isPassive := scanType.IsPassive()
			isActive := scanType.IsActive()

			if isPassive == isActive {
				t.Errorf("%s: IsPassive=%v IsActive=%v — must be exactly one", scanType, isPassive, isActive)
			}
			if scanType.RequiresPermission() != isActive {
				t.Errorf("%s: RequiresPermission=%v does not match IsActive=%v", scanType, scanType.RequiresPermission(), isActive)
			}
		})
	}
}

// BenchmarkScanTypeCategory benchmarks category lookup
func BenchmarkScanTypeCategory(b *testing.B) {
	for i := 0; i < b.N; i++ {
		model.ScanTypeDNS.Category()
	}
}
