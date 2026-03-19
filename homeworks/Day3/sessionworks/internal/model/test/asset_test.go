package test

import (
	"testing"

	"mini-asm/internal/model"
)

func TestIsValidType(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"domain", "domain", true},
		{"ip", "ip", true},
		{"service", "service", true},
		{"empty", "", false},
		{"invalid", "invalid", false},
		{"uppercase DOMAIN", "DOMAIN", false},
		{"mixed case Ip", "Ip", false},
		{"with space", " domain", false},
		{"number", "123", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := model.IsValidType(tt.input); got != tt.want {
				t.Errorf("IsValidType(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestIsValidStatus(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"active", "active", true},
		{"inactive", "inactive", true},
		{"empty", "", false},
		{"deleted", "deleted", false},
		{"ACTIVE uppercase", "ACTIVE", false},
		{"pending", "pending", false},
		{"with space", " active", false},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := model.IsValidStatus(tt.input); got != tt.want {
				t.Errorf("IsValidStatus(%q) = %v, want %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestConstants(t *testing.T) {
	if model.TypeDomain != "domain" {
		t.Errorf("TypeDomain = %q, want %q", model.TypeDomain, "domain")
	}
	if model.TypeIP != "ip" {
		t.Errorf("TypeIP = %q, want %q", model.TypeIP, "ip")
	}
	if model.TypeService != "service" {
		t.Errorf("TypeService = %q, want %q", model.TypeService, "service")
	}
	if model.StatusActive != "active" {
		t.Errorf("StatusActive = %q, want %q", model.StatusActive, "active")
	}
	if model.StatusInactive != "inactive" {
		t.Errorf("StatusInactive = %q, want %q", model.StatusInactive, "inactive")
	}
}
