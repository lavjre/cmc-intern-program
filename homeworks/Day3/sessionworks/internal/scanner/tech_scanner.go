package scanner

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"mini-asm/internal/model"
)

type TechScanner struct {
	client *http.Client
}

func NewTechScanner() *TechScanner {
	return &TechScanner{
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *TechScanner) Type() model.ScanType {
	return model.ScanTypeTech
}

type DetectedTech struct {
	Name       string `json:"name"`
	Category   string `json:"category"`
	Version    string `json:"version,omitempty"`
	Confidence int    `json:"confidence"`
}

func (s *TechScanner) Scan(asset *model.Asset) (*model.TechScanResult, error) {
	if asset.Type != model.TypeDomain {
		return nil, fmt.Errorf("tech scan only works on domain assets, got: %s", asset.Type)
	}

	url := "https://" + asset.Name
	resp, err := s.client.Get(url)
	if err != nil {
		url = "http://" + asset.Name
		resp, err = s.client.Get(url)
		if err != nil {
			return nil, fmt.Errorf("http request failed: %w", err)
		}
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(io.LimitReader(resp.Body, 100*1024))
	body := string(bodyBytes)

	var techs []DetectedTech
	headers := make(map[string]string)

	for key, values := range resp.Header {
		headers[strings.ToLower(key)] = values[0]
	}

	if server := resp.Header.Get("Server"); server != "" {
		parts := strings.SplitN(server, "/", 2)
		tech := DetectedTech{Name: strings.TrimSpace(parts[0]), Category: "Web Server", Confidence: 100}
		if len(parts) > 1 {
			tech.Version = strings.TrimSpace(parts[1])
		}
		techs = append(techs, tech)
	}

	if poweredBy := resp.Header.Get("X-Powered-By"); poweredBy != "" {
		parts := strings.SplitN(poweredBy, "/", 2)
		tech := DetectedTech{Name: strings.TrimSpace(parts[0]), Category: "Backend Framework", Confidence: 90}
		if len(parts) > 1 {
			tech.Version = strings.TrimSpace(parts[1])
		}
		techs = append(techs, tech)
	}

	metaTags := make(map[string]string)
	re := regexp.MustCompile(`<meta[^>]+name="generator"[^>]+content="([^"]+)"`)
	if match := re.FindStringSubmatch(body); len(match) > 1 {
		metaTags["generator"] = match[1]
		techs = append(techs, DetectedTech{Name: match[1], Category: "CMS/Framework", Confidence: 95})
	}

	if strings.Contains(body, "__NEXT_DATA__") || strings.Contains(body, "_next/") {
		techs = append(techs, DetectedTech{Name: "Next.js", Category: "JavaScript Framework", Confidence: 90})
	} else if strings.Contains(body, "react") || strings.Contains(body, "__REACT") {
		techs = append(techs, DetectedTech{Name: "React", Category: "JavaScript Framework", Confidence: 80})
	}

	if resp.Header.Get("Cf-Ray") != "" {
		techs = append(techs, DetectedTech{Name: "Cloudflare", Category: "CDN", Confidence: 100})
	}

	techRaw, _ := json.Marshal(techs)
	headersRaw, _ := json.Marshal(headers)
	metaRaw, _ := json.Marshal(metaTags)

	return &model.TechScanResult{
		Domain:       asset.Name,
		TechJSON:     string(techRaw),
		HeadersJSON:  string(headersRaw),
		MetaTagsJSON: string(metaRaw),
	}, nil
}

//bai1
