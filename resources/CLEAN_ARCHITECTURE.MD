# 🏗️ PROJECT STRUCTURE & CLEAN ARCHITECTURE

## Mục đích

Tài liệu này giải thích cấu trúc project Mini ASM và nguyên tắc Clean Architecture được áp dụng.

---

## 1. PROJECT STRUCTURE

```
mini-asm/
├── cmd/                     # Application entry points
│   └── server/
│       └── main.go          # Main entry point - khởi tạo và chạy server
│
├── internal/                # Private application code
│   ├── handler/             # HTTP handlers (Presentation Layer)
│   │   ├── asset_handler.go
│   │   ├── health_handler.go
│   │   └── handler.go       # Handler registry
│   │
│   ├── service/             # Business logic (Use Case Layer)
│   │   ├── asset_service.go
│   │   └── service.go       # Service interface
│   │
│   ├── storage/             # Data access (Infrastructure Layer)
│   │   ├── storage.go       # Storage interface
│   │   ├── memory/          # In-memory implementation
│   │   │   └── memory.go
│   │   └── postgres/        # Database implementation
│   │       └── postgres.go
│   │
│   └── model/               # Domain models (Entity Layer)
│       ├── asset.go
│       └── errors.go
│
├── test/                    # Integration tests
│   ├── handler_test.go
│   └── integration_test.go
│
├── web/                     # Frontend static files
│   ├── index.html
│   └── app.js
│
├── migrations/              # Database migrations
│   ├── 001_create_assets.up.sql
│   └── 001_create_assets.down.sql
│
├── .env.example             # Environment variables template
├── .gitignore
├── go.mod
├── go.sum
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 2. CLEAN ARCHITECTURE LAYERS

Clean Architecture chia hệ thống thành các layer độc lập, với dependency flow từ ngoài vào trong.

### 2.1 Dependency Rule

**Nguyên tắc quan trọng nhất:**

> Code ở layer bên trong KHÔNG được biết gì về layer bên ngoài.

```
┌─────────────────────────────────────┐
│   Presentation Layer (handler/)     │  ← HTTP, JSON, UI concerns
├─────────────────────────────────────┤
│   Use Case Layer (service/)         │  ← Business logic
├─────────────────────────────────────┤
│   Infrastructure Layer (storage/)   │  ← Database, external services
└─────────────────────────────────────┘
           ↓ depends on
┌─────────────────────────────────────┐
│   Entity Layer (model/)              │  ← Core domain models
└─────────────────────────────────────┘
```

### 2.2 Layer Chi Tiết

#### **Entity Layer (model/)**

Core domain models - không phụ thuộc vào bất kỳ layer nào khác.

```go
// model/asset.go
package model

import "time"

type Asset struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Type      string    `json:"type"`
    Status    string    `json:"status"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}

// Asset types
const (
    TypeDomain  = "domain"
    TypeIP      = "ip"
    TypeService = "service"
)

// Asset status
const (
    StatusActive   = "active"
    StatusInactive = "inactive"
)
```

#### **Infrastructure Layer (storage/)**

Xử lý data persistence - implements storage interface.

```go
// storage/storage.go
package storage

import "mini-asm/internal/model"

// Storage defines the interface for data access
type Storage interface {
    Create(asset *model.Asset) error
    GetAll() ([]*model.Asset, error)
    GetByID(id string) (*model.Asset, error)
    Update(id string, asset *model.Asset) error
    Delete(id string) error
    Filter(assetType, status string) ([]*model.Asset, error)
    Search(query string) ([]*model.Asset, error)
}
```

**Ưu điểm:**

- Dễ dàng swap giữa in-memory và database
- Test được mà không cần database thật
- Cách ly business logic khỏi implementation details

#### **Use Case Layer (service/)**

Business logic - orchestrate operations, validation, business rules.

```go
// service/asset_service.go
package service

import (
    "errors"
    "mini-asm/internal/model"
    "mini-asm/internal/storage"
    "time"

    "github.com/google/uuid"
)

type AssetService struct {
    storage storage.Storage
}

func NewAssetService(storage storage.Storage) *AssetService {
    return &AssetService{storage: storage}
}

func (s *AssetService) CreateAsset(name, assetType string) (*model.Asset, error) {
    // Validation
    if name == "" {
        return nil, errors.New("name is required")
    }

    if !isValidType(assetType) {
        return nil, errors.New("invalid asset type")
    }

    // Business logic
    asset := &model.Asset{
        ID:        uuid.New().String(),
        Name:      name,
        Type:      assetType,
        Status:    model.StatusActive,
        CreatedAt: time.Now(),
        UpdatedAt: time.Now(),
    }

    // Delegate to storage
    if err := s.storage.Create(asset); err != nil {
        return nil, err
    }

    return asset, nil
}

func isValidType(t string) bool {
    return t == model.TypeDomain || t == model.TypeIP || t == model.TypeService
}
```

**Trách nhiệm:**

- Validation input
- Business rules enforcement
- Orchestrate operations
- Error handling

#### **Presentation Layer (handler/)**

HTTP handlers - xử lý HTTP request/response, JSON marshalling.

```go
// handler/asset_handler.go
package handler

import (
    "encoding/json"
    "net/http"

    "mini-asm/internal/service"
)

type AssetHandler struct {
    service *service.AssetService
}

func NewAssetHandler(service *service.AssetService) *AssetHandler {
    return &AssetHandler{service: service}
}

func (h *AssetHandler) CreateAsset(w http.ResponseWriter, r *http.Request) {
    // Parse request
    var req struct {
        Name string `json:"name"`
        Type string `json:"type"`
    }

    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        RespondError(w, http.StatusBadRequest, "Invalid request body")
        return
    }

    // Call service
    asset, err := h.service.CreateAsset(req.Name, req.Type)
    if err != nil {
        RespondError(w, http.StatusBadRequest, err.Error())
        return
    }

    // Return response
    RespondJSON(w, http.StatusCreated, asset)
}

// Helper functions
func RespondJSON(w http.ResponseWriter, status int, data interface{}) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func RespondError(w http.ResponseWriter, status int, message string) {
    RespondJSON(w, status, map[string]string{"error": message})
}
```

**Trách nhiệm:**

- Parse HTTP request
- Validate HTTP-specific concerns
- Call appropriate service method
- Format HTTP response
- Set appropriate status codes

---

## 3. WIRE UP - Main Entry Point

File `cmd/server/main.go` là nơi wire up tất cả dependencies.

```go
// cmd/server/main.go
package main

import (
    "log"
    "net/http"

    "mini-asm/internal/handler"
    "mini-asm/internal/service"
    "mini-asm/internal/storage/memory"
)

func main() {
    // Initialize storage (Buổi 2: memory, Buổi 3: postgres)
    store := memory.NewMemoryStorage()

    // Initialize service
    assetService := service.NewAssetService(store)

    // Initialize handlers
    assetHandler := handler.NewAssetHandler(assetService)
    healthHandler := handler.NewHealthHandler()

    // Setup routes
    mux := http.NewServeMux()

    mux.HandleFunc("GET /health", healthHandler.Check)
    mux.HandleFunc("POST /assets", assetHandler.CreateAsset)
    mux.HandleFunc("GET /assets", assetHandler.ListAssets)
    mux.HandleFunc("GET /assets/{id}", assetHandler.GetAsset)
    mux.HandleFunc("PUT /assets/{id}", assetHandler.UpdateAsset)
    mux.HandleFunc("DELETE /assets/{id}", assetHandler.DeleteAsset)

    // Start server
    log.Println("Server starting on :8080")
    if err := http.ListenAndServe(":8080", mux); err != nil {
        log.Fatal(err)
    }
}
```

---

## 4. LỢI ÍCH CỦA CLEAN ARCHITECTURE

### 4.1 Testability

Mỗi layer có thể test độc lập:

```go
// Test service without real storage
func TestAssetService_CreateAsset(t *testing.T) {
    mockStorage := &MockStorage{}
    service := service.NewAssetService(mockStorage)

    asset, err := service.CreateAsset("example.com", "domain")

    assert.NoError(t, err)
    assert.NotEmpty(t, asset.ID)
}
```

### 4.2 Flexibility

Dễ dàng thay đổi implementation:

```go
// Buổi 2: In-memory
store := memory.NewMemoryStorage()

// Buổi 3: Switch to database - code khác không thay đổi
store := postgres.NewPostgresStorage(db)
```

### 4.3 Maintainability

- Code có cấu trúc rõ ràng
- Dễ tìm bug (biết chính xác layer nào có vấn đề)
- Dễ onboard developer mới

### 4.4 Separation of Concerns

Mỗi layer có trách nhiệm riêng:

- Handler: HTTP concerns
- Service: Business logic
- Storage: Data access
- Model: Domain entities

---

## 5. SO SÁNH CLEAN ARCHITECTURE VỚI MVC

### 5.1 Tổng Quan MVC Architecture

MVC (Model-View-Controller) là pattern phổ biến cho web applications:

```
┌──────────┐      ┌────────────┐      ┌───────┐
│   View   │ ←──→ │ Controller │ ←──→ │ Model │
└──────────┘      └────────────┘      └───────┘
```

**MVC trong Go có thể trông như thế này:**

```
project/
├── main.go
├── controllers/
│   └── asset_controller.go
├── models/
│   └── asset.go
└── views/
    └── templates/
```

### 5.2 So Sánh Chi Tiết

| Khía Cạnh                | MVC                                       | Clean Architecture                                         |
| ------------------------ | ----------------------------------------- | ---------------------------------------------------------- |
| **Số lượng layers**      | 3 layers (Model, View, Controller)        | 4+ layers (Entity, Use Case, Interface Adapter, Framework) |
| **Business Logic**       | Thường nằm trong Model hoặc Controller    | Tách riêng trong Use Case/Service layer                    |
| **Dependency Direction** | Controller → Model, View → Model          | Luôn hướng vào trong (Dependency Rule)                     |
| **Testability**          | Khó test Controller (phụ thuộc framework) | Dễ test (mỗi layer độc lập)                                |
| **Database Coupling**    | Model thường coupled với ORM/DB           | Storage layer cách ly, dễ swap implementation              |
| **Flexibility**          | Khó thay đổi framework/database           | Dễ dàng thay đổi external dependencies                     |
| **Complexity**           | Đơn giản, dễ học                          | Phức tạp hơn, nhiều abstraction                            |
| **Best For**             | Small to medium projects, CRUD apps       | Large projects, complex business logic                     |

### 5.3 Code Comparison

#### MVC Style (Simple but Coupled)

```go
// controllers/asset_controller.go
type AssetController struct {
    db *sql.DB
}

func (c *AssetController) CreateAsset(w http.ResponseWriter, r *http.Request) {
    var req Request
    json.NewDecoder(r.Body).Decode(&req)

    // Validation + Business logic + SQL - tất cả trong controller
    if req.Name == "" {
        http.Error(w, "name required", 400)
        return
    }

    // Direct SQL query
    _, err := c.db.Exec(
        "INSERT INTO assets (name, type) VALUES (?, ?)",
        req.Name, req.Type,
    )

    if err != nil {
        http.Error(w, err.Error(), 500)
        return
    }

    json.NewEncoder(w).Encode(map[string]string{"status": "created"})
}
```

**Vấn đề:**

- ❌ Controller biết về database implementation
- ❌ Business logic lẫn với HTTP handling
- ❌ Khó test (cần database thật)
- ❌ Khó scale khi logic phức tạp

#### Clean Architecture Style (More Layers, More Flexible)

```go
// handler/asset_handler.go (Presentation Layer)
func (h *AssetHandler) CreateAsset(w http.ResponseWriter, r *http.Request) {
    var req Request
    json.NewDecoder(r.Body).Decode(&req)

    // Chỉ handle HTTP concerns
    asset, err := h.service.CreateAsset(req.Name, req.Type)
    if err != nil {
        RespondError(w, http.StatusBadRequest, err.Error())
        return
    }

    RespondJSON(w, http.StatusCreated, asset)
}

// service/asset_service.go (Use Case Layer)
func (s *AssetService) CreateAsset(name, assetType string) (*model.Asset, error) {
    // Business logic và validation
    if name == "" {
        return nil, errors.New("name is required")
    }

    asset := &model.Asset{
        ID:     uuid.New().String(),
        Name:   name,
        Type:   assetType,
        Status: model.StatusActive,
    }

    // Delegate to storage interface
    return asset, s.storage.Create(asset)
}

// storage/postgres/postgres.go (Infrastructure Layer)
func (s *PostgresStorage) Create(asset *model.Asset) error {
    // Pure data access logic
    _, err := s.db.Exec(
        "INSERT INTO assets (id, name, type, status) VALUES ($1, $2, $3, $4)",
        asset.ID, asset.Name, asset.Type, asset.Status,
    )
    return err
}
```

**Ưu điểm:**

- ✅ Mỗi layer có responsibility rõ ràng
- ✅ Service layer test được mà không cần HTTP hay DB
- ✅ Dễ swap storage (memory → postgres → mongodb)
- ✅ Business logic tách biệt và reusable

### 5.4 Khi Nào Dùng MVC vs Clean Architecture?

#### Dùng MVC khi:

✅ Project nhỏ, CRUD đơn giản
✅ Team nhỏ, cần ship nhanh
✅ Business logic không phức tạp
✅ Ít khi thay đổi database/framework
✅ Prototype, MVP

**Ví dụ:** Blog cá nhân, admin dashboard đơn giản, internal tools

#### Dùng Clean Architecture khi:

✅ Project lớn, phức tạp
✅ Business logic phong phú
✅ Cần testability cao
✅ Nhiều developers cùng làm việc
✅ Dự kiến thay đổi database/framework
✅ Long-term maintenance

**Ví dụ:** E-commerce platform, banking system, enterprise applications

### 5.5 Evolution Path

Nhiều projects bắt đầu với MVC và evolve sang Clean Architecture:

```
Stage 1: Simple MVC
  → Fast development
  → Good for MVP

Stage 2: Growing Complexity
  → Business logic phức tạp
  → Hard to test
  → Controllers become bloated

Stage 3: Refactor to Clean Architecture
  → Extract service layer
  → Add storage abstractions
  → Improve testability
```

### 5.6 Hybrid Approach

Trong thực tế, bạn có thể mix:

```go
// Giữ MVC structure nhưng thêm service layer
controllers/
  └── asset_controller.go    // Thin controller
services/                     // Business logic
  └── asset_service.go
models/
  └── asset.go
repositories/                 // Data access
  └── asset_repository.go
```

Đây là **good middle ground** cho nhiều projects!

---

## 6. ANTI-PATTERNS CẦN TRÁNH

### ❌ Mixing Layers

```go
// BAD: Handler chứa business logic và SQL
func (h *Handler) CreateAsset(w http.ResponseWriter, r *http.Request) {
    var req Request
    json.NewDecoder(r.Body).Decode(&req)

    // Business logic trong handler - WRONG!
    if req.Name == "" {
        http.Error(w, "name required", 400)
        return
    }

    // SQL trong handler - WRONG!
    db.Exec("INSERT INTO assets VALUES (?, ?)", req.Name, req.Type)
}
```

### ❌ Wrong Dependency Direction

```go
// BAD: Model phụ thuộc vào storage
type Asset struct {
    ID   string
    DB   *sql.DB  // WRONG! Entity không nên biết về database
}
```

### ❌ Skipping Layers

```go
// BAD: Handler gọi trực tiếp storage
func (h *Handler) CreateAsset(w http.ResponseWriter, r *http.Request) {
    asset := parseRequest(r)
    h.storage.Create(asset)  // WRONG! Bỏ qua service layer
}
```

---

## 7. CHECKLIST

Khi implement feature mới, follow checklist này:

- [ ] **Model**: Define domain entity trong `model/`
- [ ] **Storage Interface**: Add method to storage interface
- [ ] **Storage Implementation**: Implement trong `memory/` hoặc `postgres/`
- [ ] **Service**: Add business logic method trong `service/`
- [ ] **Handler**: Add HTTP handler trong `handler/`
- [ ] **Main**: Wire up trong `main.go`
- [ ] **Test**: Viết test cho từng layer

---

## 8. EVOLVING THE ARCHITECTURE

### Buổi 2: Basic Structure

```
cmd/server/main.go
internal/
  ├── handler/
  ├── service/
  ├── storage/memory/
  └── model/
```

### Buổi 3: Add Database

```
+ internal/storage/postgres/
+ migrations/
```

### Buổi 5: Add Tests

```
+ test/
+ *_test.go files
```

### Buổi 6: Add Frontend

```
+ web/
+ Dockerfile
+ docker-compose.yml
```

---

## 📚 TÀI LIỆU THAM KHẢO

- [The Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Go Project Layout](https://github.com/golang-standards/project-layout)
- [Dependency Injection in Go](https://blog.drewolson.org/dependency-injection-in-go)
