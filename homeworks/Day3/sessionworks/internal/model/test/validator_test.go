package test

import (
	"testing"

	"mini-asm/internal/validator"
)

func TestValidateName(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"valid", "example.com", false},
		{"valid ip", "192.168.1.1", false},
		{"empty", "", true},
		{"too long", string(make([]byte, 256)), true},
		{"null byte", "test\x00evil", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateName(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateName(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}

func TestValidateType(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"domain", "domain", false},
		{"ip", "ip", false},
		{"service", "service", false},
		{"invalid", "xyz", true},
		{"empty", "", true},
		{"uppercase", "DOMAIN", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateType(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateType(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}

func TestValidateStatus(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"active", "active", false},
		{"inactive", "inactive", false},
		{"deleted", "deleted", true},
		{"empty", "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateStatus(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateStatus(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}

func TestValidateDomain(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"simple", "example.com", false},
		{"subdomain", "sub.example.com", false},
		{"deep subdomain", "a.b.c.example.com", false},
		{"with hyphen", "my-domain.com", false},
		{"single label", "localhost", false},
		{"starts with dot", ".example.com", true},
		{"ends with dot", "example.com.", true},
		{"double dot", "example..com", true},
		{"starts with hyphen", "-example.com", true},
		{"ends with hyphen", "example-.com", true},
		{"special chars", "exam!ple.com", true},
		{"spaces", "exam ple.com", true},
		{"empty", "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateDomain(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateDomain(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}

func TestValidateIP(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"ipv4 valid", "192.168.1.1", false},
		{"ipv4 localhost", "127.0.0.1", false},
		{"ipv4 zeros", "0.0.0.0", false},
		{"ipv6 loopback", "::1", false},
		{"ipv6 full", "2001:0db8:85a3:0000:0000:8a2e:0370:7334", false},
		{"not an ip", "not-an-ip", true},
		{"domain", "example.com", true},
		{"empty", "", true},
		{"partial", "192.168", true},
		{"out of range", "999.999.999.999", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateIP(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateIP(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}

func TestValidateService(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"simple name", "ssh", false},
		{"http url", "http://example.com", false},
		{"https with port", "https://example.com:443", false},
		{"with path", "http://example.com/api", false},
		{"empty", "", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateService(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateService(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}

func TestValidateCreate(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name      string
		assetName string
		assetType string
		wantErr   bool
	}{
		{"valid domain", "example.com", "domain", false},
		{"valid ip", "192.168.1.1", "ip", false},
		{"valid service", "ssh", "service", false},
		{"empty name", "", "domain", true},
		{"invalid type", "example.com", "xyz", true},
		{"domain with invalid format", "exam!ple.com", "domain", true},
		{"ip with invalid format", "not-an-ip", "ip", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateCreate(tt.assetName, tt.assetType)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateCreate(%q, %q) error = %v, wantErr %v", tt.assetName, tt.assetType, err, tt.wantErr)
			}
		})
	}
}

func TestValidatePaginationParams(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name     string
		page     int
		pageSize int
		wantErr  bool
	}{
		{"valid", 1, 20, false},
		{"page 0", 0, 20, true},
		{"negative page", -1, 20, true},
		{"pageSize 0", 1, 0, true},
		{"pageSize too large", 1, 101, true},
		{"pageSize max", 1, 100, false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidatePaginationParams(tt.page, tt.pageSize)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidatePaginationParams(%d, %d) error = %v, wantErr %v", tt.page, tt.pageSize, err, tt.wantErr)
			}
		})
	}
}

func TestValidateSortParams(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name      string
		sortBy    string
		sortOrder string
		wantErr   bool
	}{
		{"valid name asc", "name", "asc", false},
		{"valid created_at desc", "created_at", "desc", false},
		{"empty both", "", "", false},
		{"invalid field", "invalid_field", "asc", true},
		{"invalid order", "name", "random", true},
		{"sql injection attempt", "name; DROP TABLE", "asc", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateSortParams(tt.sortBy, tt.sortOrder)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateSortParams(%q, %q) error = %v, wantErr %v", tt.sortBy, tt.sortOrder, err, tt.wantErr)
			}
		})
	}
}

func TestValidateSearchQuery(t *testing.T) {
	v := validator.NewAssetValidator()
	tests := []struct {
		name    string
		input   string
		wantErr bool
	}{
		{"valid", "example", false},
		{"empty", "", false},
		{"too long", string(make([]byte, 256)), true},
		{"sql injection single quote", "'; DROP TABLE--", true},
		{"sql injection double quote", "\" OR 1=1", true},
		{"sql comment", "test /* comment */", true},
		{"semicolon", "test; SELECT", true},
		{"double dash", "test -- comment", true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateSearchQuery(tt.input)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateSearchQuery(%q) error = %v, wantErr %v", tt.input, err, tt.wantErr)
			}
		})
	}
}
