package scanner

import (
	"encoding/json"
	"fmt"
	"net"
	"time"

	"mini-asm/internal/model"
)

type PortScanner struct {
	ports   []int
	timeout time.Duration
}

func NewPortScanner() *PortScanner {
	return &PortScanner{
		ports: []int{
			21, 22, 23, 25, 53, 80, 110, 143,
			443, 993, 995, 3306, 5432, 6379, 8080, 8443,
		},
		timeout: 800 * time.Millisecond,
	}
}

func (s *PortScanner) Type() model.ScanType {
	return model.ScanTypePort
}

func isPrivateOrLoopbackIP(ipStr string) bool {
	ip := net.ParseIP(ipStr)
	if ip == nil {
		return false
	}
	if ip.IsLoopback() {
		return true
	}
	privateCIDRs := []string{
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
	}
	for _, cidr := range privateCIDRs {
		_, network, err := net.ParseCIDR(cidr)
		if err == nil && network.Contains(ip) {
			return true
		}
	}
	return false
}

func (s *PortScanner) Scan(asset *model.Asset) (*model.PortScanResult, error) {
	if asset.Type != model.TypeIP {
		return nil, fmt.Errorf("port scan only works on ip assets, got: %s", asset.Type)
	}
	if !isPrivateOrLoopbackIP(asset.Name) {
		return nil, fmt.Errorf("port scan blocked: %s is not a private/loopback IP", asset.Name)
	}

	start := time.Now()
	var openPorts []map[string]any
	closed := 0

	for _, port := range s.ports {
		addr := fmt.Sprintf("%s:%d", asset.Name, port)
		conn, err := net.DialTimeout("tcp", addr, s.timeout)
		if err != nil {
			closed++
			continue
		}
		_ = conn.Close()
		openPorts = append(openPorts, map[string]any{
			"port":     port,
			"protocol": "tcp",
			"state":    "open",
			"service":  guessService(port),
			"version":  "",
		})
	}

	duration := time.Since(start).Milliseconds()
	portsJSON, _ := json.Marshal(openPorts)

	return &model.PortScanResult{
		IPAddress:     asset.Name,
		OpenPortsJSON: string(portsJSON),
		ClosedPorts:   closed,
		TotalScanned:  len(s.ports),
		ScanDuration:  int(duration),
	}, nil
}

func guessService(port int) string {
	services := map[int]string{
		21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp",
		53: "dns", 80: "http", 110: "pop3", 143: "imap",
		443: "https", 993: "imaps", 995: "pop3s",
		3306: "mysql", 5432: "postgresql", 6379: "redis",
		8080: "http-alt", 8443: "https-alt",
	}
	if name, ok := services[port]; ok {
		return name
	}
	return "unknown"
}

//bai1
