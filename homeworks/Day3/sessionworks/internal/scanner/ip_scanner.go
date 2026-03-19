package scanner

import (
	"encoding/json"
	"fmt"
	"net"
	"strings"

	"mini-asm/internal/model"
)

type IPScanner struct{}

func NewIPScanner() *IPScanner {
	return &IPScanner{}
}

func (s *IPScanner) Type() model.ScanType {
	return model.ScanTypeIP
}

func (s *IPScanner) Scan(asset *model.Asset) (*model.IPScanResult, error) {
	if asset.Type != model.TypeIP {
		return nil, fmt.Errorf("ip scan only works on ip assets, got: %s", asset.Type)
	}

	names, _ := net.LookupAddr(asset.Name)
	reverseDNS := ""
	if len(names) > 0 {
		reverseDNS = strings.TrimSuffix(names[0], ".")
	}

	geo := map[string]any{
		"country": "", "country_code": "", "city": "",
		"region": "", "latitude": 0, "longitude": 0,
		"isp": "", "org": "",
	}
	asn := map[string]any{
		"number": 0, "name": "", "description": "",
	}

	geoRaw, _ := json.Marshal(geo)
	asnRaw, _ := json.Marshal(asn)

	return &model.IPScanResult{
		IPAddress:  asset.Name,
		GeoJSON:    string(geoRaw),
		ASNJSON:    string(asnRaw),
		ReverseDNS: reverseDNS,
	}, nil
}

//bai1
