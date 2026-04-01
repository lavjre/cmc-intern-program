package scanner

import (
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"math"
	"net"
	"time"

	"mini-asm/internal/model"
)

type SSLScanner struct {
	timeout time.Duration
}

func NewSSLScanner() *SSLScanner {
	return &SSLScanner{timeout: 10 * time.Second}
}

func (s *SSLScanner) Type() model.ScanType {
	return model.ScanTypeSSL
}

func (s *SSLScanner) Scan(asset *model.Asset) (*model.SSLScanResult, error) {
	if asset.Type != model.TypeDomain {
		return nil, fmt.Errorf("ssl scan only works on domain assets, got: %s", asset.Type)
	}

	conn, err := tls.DialWithDialer(
		&net.Dialer{Timeout: s.timeout},
		"tcp", asset.Name+":443",
		&tls.Config{InsecureSkipVerify: false},
	)
	if err != nil {
		return nil, fmt.Errorf("tls connect failed: %w", err)
	}
	defer conn.Close()

	state := conn.ConnectionState()
	if len(state.PeerCertificates) == 0 {
		return nil, fmt.Errorf("no certificates found")
	}

	cert := state.PeerCertificates[0]
	now := time.Now()
	daysUntilExpiry := int(math.Ceil(cert.NotAfter.Sub(now).Hours() / 24))

	certInfo := map[string]any{
		"subject":           cert.Subject.CommonName,
		"issuer":            cert.Issuer.CommonName,
		"serial_number":     fmt.Sprintf("%X", cert.SerialNumber),
		"valid_from":        cert.NotBefore.Format(time.RFC3339),
		"valid_until":       cert.NotAfter.Format(time.RFC3339),
		"days_until_expiry": daysUntilExpiry,
		"is_expired":        now.After(cert.NotAfter),
		"is_self_signed":    cert.Issuer.CommonName == cert.Subject.CommonName,
		"san":               cert.DNSNames,
	}
	connInfo := map[string]any{
		"tls_version":  tlsVersionString(state.Version),
		"cipher_suite": tls.CipherSuiteName(state.CipherSuite),
	}

	grade := calculateGrade(cert, state)
	certRaw, _ := json.Marshal(certInfo)
	connRaw, _ := json.Marshal(connInfo)
	issuesRaw, _ := json.Marshal([]string{})

	return &model.SSLScanResult{
		Domain:     asset.Name,
		CertJSON:   string(certRaw),
		ConnJSON:   string(connRaw),
		Grade:      grade,
		IssuesJSON: string(issuesRaw),
	}, nil
}

func tlsVersionString(v uint16) string {
	switch v {
	case tls.VersionTLS10:
		return "TLS 1.0"
	case tls.VersionTLS11:
		return "TLS 1.1"
	case tls.VersionTLS12:
		return "TLS 1.2"
	case tls.VersionTLS13:
		return "TLS 1.3"
	default:
		return "Unknown"
	}
}

func calculateGrade(cert *x509.Certificate, state tls.ConnectionState) string {
	now := time.Now()
	if now.After(cert.NotAfter) {
		return "F"
	}
	if cert.Issuer.CommonName == cert.Subject.CommonName {
		return "C"
	}
	if state.Version < tls.VersionTLS12 {
		return "B"
	}
	if state.Version >= tls.VersionTLS13 {
		return "A"
	}
	return "B"
}

//bai1
