# 📚 KẾ HOẠCH ĐÀO TẠO - MINI ASM PROJECT

## Tổng Quan

**Duration:** 3 tuần (6 buổi, mỗi tuần 2 buổi)  
**Project:** Mini Attack Surface Management (ASM)  
**Approach:** Incremental development với code sẵn để giải thích và so sánh

---

## 🎯 Mục Tiêu Tổng Thể

Sau khóa học, học viên có khả năng:

- ✅ Hiểu và áp dụng Clean Architecture
- ✅ Phát triển RESTful API với Go
- ✅ Làm việc với database (PostgreSQL)
- ✅ Viết test và maintain code quality
- ✅ Deploy application với Docker

---

## 📁 Cấu Trúc Thư Mục

```
week1/
├── session1-foundation/       # Buổi 1: Setup & Hello World
├── session2-basic-api/        # Buổi 2: CRUD cơ bản với in-memory
├── session3-database/         # Buổi 3: PostgreSQL integration
├── session4-advanced/         # Buổi 4: Filter, search, validation
├── session5-testing/          # Buổi 5: Unit & integration tests
├── session6-deployment/       # Buổi 6: Frontend & Docker
└── docs/                      # API spec & requirements
```

---

## 🗓️ CHI TIẾT TỪNG BUỔI

### **Buổi 1: Foundation & Project Setup** (3 giờ)

#### Mục tiêu

- Hiểu software development lifecycle
- Setup Git workflow
- Hiểu Go fundamentals
- Thiết lập project structure

#### Nội dung lý thuyết (1.5h)

1. **Software Development Lifecycle** (30 phút)
   - Waterfall vs Agile
   - Requirements → Design → Implementation → Testing → Deployment
   - Giới thiệu project Mini ASM

2. **Git & Version Control** (30 phút)
   - Git flow: branch, commit, merge
   - Best practices: commit messages, branching strategy
   - Hands-on: Clone repo, create branch

3. **Go Fundamentals** (30 phút)
   - Why Go? (simple, fast, concurrent)
   - Go syntax basics: types, functions, structs
   - Packages và imports

#### Thực hành (1.5h)

- **Setup project structure** (folder session1-foundation)

  ```
  ├── cmd/server/main.go         # Hello World server
  ├── internal/
  │   ├── model/                 # Empty (chuẩn bị cho buổi 2)
  │   ├── handler/               # Empty
  │   ├── service/               # Empty
  │   └── storage/               # Empty
  ├── go.mod
  └── README.md
  ```

- **Code walkthrough:**
  - `main.go`: Simple HTTP server với 1 endpoint `/health`
  - Giải thích: `package`, `import`, `http.HandleFunc`
  - Chạy: `go run cmd/server/main.go`
  - Test: `curl http://localhost:8080/health`

#### Deliverables

- [ ] Project structure đã setup
- [ ] Hello World server chạy được
- [ ] Hiểu được flow: request → handler → response

#### Homework

- Đọc CLEAN_ARCHITECTURE.MD
- Thêm endpoint `/hello/{name}` trả về greeting

---

### **Buổi 2: Basic API Development** (3 giờ)

#### Mục tiêu

- Hiểu RESTful API design
- Implement CRUD cơ bản (Create, Read)
- Sử dụng in-memory storage
- Áp dụng Clean Architecture

#### Nội dung lý thuyết (45 phút)

1. **RESTful API Design** (20 phút)
   - HTTP methods: GET, POST, PUT, DELETE
   - Status codes: 200, 201, 400, 404, 500
   - Resource naming conventions

2. **Clean Architecture Review** (25 phút)
   - 4 layers: Entity, Use Case, Interface, Framework
   - Dependency Rule
   - So sánh với MVC (phần mới thêm trong tài liệu)

#### Thực hành (2h 15m)

- **Code walkthrough session2-basic-api:**

  **Bước 1: Entity Layer** (30 phút)

  ```go
  // internal/model/asset.go
  type Asset struct {
      ID        string
      Name      string
      Type      string
      Status    string
      CreatedAt time.Time
      UpdatedAt time.Time
  }
  ```

  - Giải thích: Pure domain model, không dependency
  - Constants cho Type và Status

  **Bước 2: Storage Layer** (30 phút)

  ```go
  // internal/storage/storage.go - Interface
  type Storage interface {
      Create(asset *model.Asset) error
      GetAll() ([]*model.Asset, error)
      GetByID(id string) (*model.Asset, error)
  }

  // internal/storage/memory/memory.go - Implementation
  type MemoryStorage struct {
      data map[string]*model.Asset
      mu   sync.RWMutex
  }
  ```

  - Giải thích: Interface cho flexibility
  - In-memory implementation với map
  - Thread-safe với mutex

  **Bước 3: Service Layer** (30 phút)

  ```go
  // internal/service/asset_service.go
  type AssetService struct {
      storage storage.Storage
  }

  func (s *AssetService) CreateAsset(name, assetType string) (*model.Asset, error) {
      // Validation
      // Generate UUID
      // Create asset
      // Save to storage
  }
  ```

  - Giải thích: Business logic, validation
  - Dependency injection (storage interface)

  **Bước 4: Handler Layer** (30 phút)

  ```go
  // internal/handler/asset_handler.go
  func (h *AssetHandler) CreateAsset(w http.ResponseWriter, r *http.Request) {
      // Parse JSON request
      // Call service
      // Return JSON response
  }
  ```

  - Giải thích: HTTP concerns only
  - JSON marshalling/unmarshalling
  - Status codes

  **Bước 5: Wire Up** (15 phút)

  ```go
  // cmd/server/main.go
  store := memory.NewMemoryStorage()
  service := service.NewAssetService(store)
  handler := handler.NewAssetHandler(service)
  ```

#### So sánh với Buổi 1

- **Trước:** 1 file, code lẫn lộn
- **Sau:** 4 layers rõ ràng, dễ maintain
- **Demo:** Thay đổi validation logic → chỉ sửa service layer

#### Deliverables

- [ ] API endpoints: POST /assets, GET /assets, GET /assets/{id}
- [ ] In-memory storage hoạt động
- [ ] Test với curl/Postman

#### Homework

- Implement PUT /assets/{id} và DELETE /assets/{id}
- Test CRUD operations

---

### **Buổi 3: Database Integration** (3 giờ)

#### Mục tiêu

- Thiết kế database schema
- Integration với PostgreSQL
- Database migration
- So sánh in-memory vs database

#### Nội dung lý thuyết (45 phút)

1. **Database Design** (20 phút)
   - Relational database concepts
   - Table design cho assets
   - Primary key, indexes, timestamps

2. **PostgreSQL & SQL** (25 phút)
   - CRUD operations trong SQL
   - Prepared statements
   - Connection pooling

#### Thực hành (2h 15m)

- **Code walkthrough session3-database:**

  **Bước 1: Database Schema** (20 phút)

  ```sql
  -- migrations/001_create_assets.up.sql
  CREATE TABLE assets (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL,
      created_at TIMESTAMP NOT NULL,
      updated_at TIMESTAMP NOT NULL
  );
  ```

  **Bước 2: PostgreSQL Storage Implementation** (45 phút)

  ```go
  // internal/storage/postgres/postgres.go
  type PostgresStorage struct {
      db *sql.DB
  }

  func (s *PostgresStorage) Create(asset *model.Asset) error {
      query := `INSERT INTO assets (id, name, type, status, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6)`
      _, err := s.db.Exec(query, asset.ID, asset.Name, asset.Type,
                          asset.Status, asset.CreatedAt, asset.UpdatedAt)
      return err
  }
  ```

  - Giải thích: Implement Storage interface
  - SQL queries với prepared statements
  - Error handling

  **Bước 3: Configuration** (20 phút)

  ```go
  // .env
  DB_HOST=localhost
  DB_PORT=5432
  DB_USER=postgres
  DB_PASS=postgres
  DB_NAME=mini_asm
  ```

  - Environment variables
  - Config loading

  **Bước 4: Docker Setup** (20 phút)

  ```yaml
  # docker-compose.yml
  services:
    db:
      image: postgres:15
      environment:
        POSTGRES_DB: mini_asm
        POSTGRES_USER: postgres
        POSTGRES_PASSWORD: postgres
      ports:
        - "5432:5432"
  ```

  - Chạy: `docker-compose up -d`

  **Bước 5: Update Main** (10 phút)

  ```go
  // cmd/server/main.go
  // Thay đổi 1 dòng:
  // store := memory.NewMemoryStorage()
  store := postgres.NewPostgresStorage(db)
  ```

#### So sánh Memory vs Database

| Aspect           | Memory          | Database                      |
| ---------------- | --------------- | ----------------------------- |
| **Code changes** | Không cần       | Chỉ thay 1 dòng trong main.go |
| **Persistence**  | Mất khi restart | Permanent                     |
| **Performance**  | Rất nhanh       | Chậm hơn một chút             |
| **Scalability**  | Single instance | Multiple instances            |

- **Key point:** Clean Architecture cho phép swap implementation dễ dàng!

#### Deliverables

- [ ] PostgreSQL running với Docker
- [ ] Migration script executed
- [ ] API hoạt động với database
- [ ] Data persist sau khi restart

#### Homework

- Thử thay đổi schema (thêm column description)
- Viết migration script

---

### **Buổi 4: Advanced Features** (3 giờ)

#### Mục tiêu

- Complete CRUD operations
- Filtering và searching
- Input validation
- Error handling patterns

#### Nội dung lý thuyết (30 phút)

1. **Input Validation** (15 phút)
   - Client-side vs server-side
   - Validation strategies
   - Error messages

2. **Query Optimization** (15 phút)
   - Filtering với WHERE clause
   - LIKE operator cho search
   - SQL injection prevention

#### Thực hành (2h 30m)

- **Code walkthrough session4-advanced:**

  **Bước 1: Update & Delete** (30 phút)

  ```go
  // internal/service/asset_service.go
  func (s *AssetService) UpdateAsset(id string, updates map[string]interface{}) error
  func (s *AssetService) DeleteAsset(id string) error
  ```

  - Giải thích: Partial updates
  - Validation logic

  **Bước 2: Filtering** (40 phút)

  ```go
  // internal/storage/postgres/postgres.go
  func (s *PostgresStorage) Filter(assetType, status string) ([]*model.Asset, error) {
      query := `SELECT * FROM assets WHERE 1=1`
      var args []interface{}

      if assetType != "" {
          query += ` AND type = $` + strconv.Itoa(len(args)+1)
          args = append(args, assetType)
      }
      // ...
  }
  ```

  - Dynamic query building
  - Query parameters

  **Bước 3: Searching** (30 phút)

  ```go
  func (s *PostgresStorage) Search(query string) ([]*model.Asset, error) {
      sqlQuery := `SELECT * FROM assets WHERE name ILIKE $1`
      rows, err := s.db.Query(sqlQuery, "%"+query+"%")
      // ...
  }
  ```

  - LIKE/ILIKE operator
  - Partial matching

  **Bước 4: Validation Package** (30 phút)

  ```go
  // internal/validator/validator.go
  type Validator struct {}

  func (v *Validator) ValidateAsset(asset *model.Asset) error {
      if asset.Name == "" {
          return errors.New("name is required")
      }
      if !isValidType(asset.Type) {
          return errors.New("invalid asset type")
      }
      return nil
  }
  ```

  **Bước 5: Error Handling** (20 phút)

  ```go
  // internal/model/errors.go
  var (
      ErrNotFound     = errors.New("asset not found")
      ErrInvalidInput = errors.New("invalid input")
      ErrDuplicate    = errors.New("asset already exists")
  )
  ```

  - Custom error types
  - Error mapping to HTTP status

#### Testing với Postman

- Test filtering: `GET /assets?type=domain&status=active`
- Test search: `GET /assets?search=example`
- Test validation errors

#### Deliverables

- [ ] Full CRUD operations
- [ ] Filtering working
- [ ] Search working
- [ ] Proper error handling

#### Homework

- Thêm pagination (limit, offset)
- Thêm sorting (sort by name, created_at)

---

### **Buổi 5: Testing & Quality** (3 giờ)

#### Mục tiêu

- Viết unit tests
- Viết integration tests
- Test coverage
- Logging và monitoring

#### Nội dung lý thuyết (45 phút)

1. **Testing in Go** (25 phút)
   - Testing pyramid: unit, integration, e2e
   - Table-driven tests
   - Mocking và interfaces

2. **Code Quality** (20 phút)
   - Clean code principles
   - Code review checklist
   - Linting tools

#### Thực hành (2h 15m)

- **Code walkthrough session5-testing:**

  **Bước 1: Unit Tests - Service Layer** (40 phút)

  ```go
  // internal/service/asset_service_test.go
  type MockStorage struct {
      mock.Mock
  }

  func (m *MockStorage) Create(asset *model.Asset) error {
      args := m.Called(asset)
      return args.Error(0)
  }

  func TestAssetService_CreateAsset(t *testing.T) {
      mockStorage := new(MockStorage)
      service := NewAssetService(mockStorage)

      mockStorage.On("Create", mock.Anything).Return(nil)

      asset, err := service.CreateAsset("example.com", "domain")

      assert.NoError(t, err)
      assert.NotEmpty(t, asset.ID)
      mockStorage.AssertExpectations(t)
  }
  ```

  - Giải thích: Mock dependencies
  - Test business logic in isolation

  **Bước 2: Table-Driven Tests** (30 phút)

  ```go
  func TestValidateAsset(t *testing.T) {
      tests := []struct {
          name    string
          asset   *model.Asset
          wantErr bool
      }{
          {"valid domain", &model.Asset{Name: "example.com", Type: "domain"}, false},
          {"empty name", &model.Asset{Name: "", Type: "domain"}, true},
          {"invalid type", &model.Asset{Name: "test", Type: "invalid"}, true},
      }

      for _, tt := range tests {
          t.Run(tt.name, func(t *testing.T) {
              err := ValidateAsset(tt.asset)
              if (err != nil) != tt.wantErr {
                  t.Errorf("got error = %v, wantErr %v", err, tt.wantErr)
              }
          })
      }
  }
  ```

  **Bước 3: Integration Tests** (40 phút)

  ```go
  // test/integration_test.go
  func TestCreateAssetAPI(t *testing.T) {
      // Setup test database
      db := setupTestDB(t)
      defer db.Close()

      // Create server
      server := setupTestServer(db)

      // Test request
      body := `{"name":"example.com","type":"domain"}`
      req := httptest.NewRequest("POST", "/assets", strings.NewReader(body))
      w := httptest.NewRecorder()

      server.ServeHTTP(w, req)

      assert.Equal(t, 201, w.Code)
  }
  ```

  - Test với database thật (test database)
  - End-to-end API testing

  **Bước 4: Logging** (25 phút)

  ```go
  // pkg/logger/logger.go
  import "go.uber.org/zap"

  var log *zap.Logger

  func Init() {
      log, _ = zap.NewProduction()
  }

  func Info(msg string, fields ...zap.Field) {
      log.Info(msg, fields...)
  }
  ```

  - Structured logging
  - Log levels
  - Request logging middleware

#### Coverage & Metrics

```bash
go test ./... -cover
go test ./... -coverprofile=coverage.out
go tool cover -html=coverage.out
```

#### Deliverables

- [ ] Unit tests cho service layer (>80% coverage)
- [ ] Integration tests cho API endpoints
- [ ] Logging implemented
- [ ] All tests passing

#### Homework

- Viết tests cho filter và search
- Thêm benchmark tests

---

### **Buổi 6: Frontend & Deployment** (3 giờ)

#### Mục tiêu

- Simple frontend integration
- API documentation
- Docker containerization
- Deployment basics

#### Nội dung lý thuyết (30 phút)

1. **Frontend-Backend Integration** (15 phút)
   - CORS
   - Static file serving
   - API consumption

2. **Containerization** (15 phút)
   - Docker basics
   - Multi-stage builds
   - Docker Compose

#### Thực hành (2h 30m)

- **Code walkthrough session6-deployment:**

  **Bước 1: Simple Frontend** (40 phút)

  ```html
  <!-- web/index.html -->
  <!DOCTYPE html>
  <html>
    <head>
      <title>Mini ASM</title>
    </head>
    <body>
      <h1>Asset Management</h1>
      <div id="assets"></div>
      <script src="app.js"></script>
    </body>
  </html>
  ```

  ```javascript
  // web/app.js
  async function loadAssets() {
    const response = await fetch("http://localhost:8080/assets");
    const assets = await response.json();
    displayAssets(assets);
  }
  ```

  - CORS middleware trong Go
  - Static file serving

  **Bước 2: Dockerfile** (30 phút)

  ```dockerfile
  # Multi-stage build
  FROM golang:1.21 AS builder
  WORKDIR /app
  COPY . .
  RUN go build -o server cmd/server/main.go

  FROM alpine:latest
  COPY --from=builder /app/server /server
  COPY --from=builder /app/web /web
  EXPOSE 8080
  CMD ["/server"]
  ```

  - Giải thích: Multi-stage để giảm image size
  - Build process

  **Bước 3: Docker Compose** (30 phút)

  ```yaml
  # docker-compose.yml
  version: "3.8"
  services:
    app:
      build: .
      ports:
        - "8080:8080"
      environment:
        - DB_HOST=db
      depends_on:
        - db

    db:
      image: postgres:15
      environment:
        POSTGRES_DB: mini_asm
      volumes:
        - pgdata:/var/lib/postgresql/data

  volumes:
    pgdata:
  ```

  **Bước 4: API Documentation** (30 phút)
  - Review api.yml
  - Swagger UI setup (optional)
  - Postman collection export

  **Bước 5: Deployment** (20 phút)

  ```bash
  # Build và run
  docker-compose up --build

  # Test
  curl http://localhost:8080/health
  ```

  - Environment-based configuration
  - Health checks
  - Graceful shutdown

#### Demo Full Stack

1. Start services: `docker-compose up`
2. Open browser: `http://localhost:8080`
3. Create asset qua UI
4. Show data trong database
5. Show logs

#### Deliverables

- [ ] Frontend integrated
- [ ] Docker images built
- [ ] Full stack running với docker-compose
- [ ] Complete documentation

---

## 📊 PROGRESS TRACKING

### Checklist cho Instructor

**Pre-Training:**

- [ ] Tạo 6 thư mục code incremental
- [ ] Prepare slides cho mỗi buổi
- [ ] Setup demo environment
- [ ] Test tất cả code samples

**Mỗi Buổi:**

- [ ] Review code buổi trước
- [ ] Live coding demo (if needed)
- [ ] Code walkthrough với explanation
- [ ] Q&A session
- [ ] Assign homework

**Post-Training:**

- [ ] Collect feedback
- [ ] Review homework submissions
- [ ] One-on-one help session
- [ ] Update materials based on feedback

---

## 🎓 EVALUATION CRITERIA

### Buổi 2-3: Basic Implementation (30%)

- Project structure đúng Clean Architecture
- CRUD operations hoạt động
- Database integration thành công

### Buổi 4-5: Advanced Features (40%)

- Filter, search implemented
- Input validation đầy đủ
- Tests có coverage > 70%

### Buổi 6: Final Project (30%)

- Full stack running
- Docker deployment success
- Code quality tốt
- Documentation đầy đủ

---

## 💡 TEACHING TIPS

### Effective Code Walkthrough

1. **Không code từ đầu** - giải thích trên code có sẵn
2. **So sánh version cũ vs mới** - highlight improvements
3. **Live debugging** - show common mistakes
4. **Interactive** - hỏi "tại sao?" thường xuyên

### Common Pitfalls to Address

- ❌ Mixing layers (business logic trong handler)
- ❌ Không handle errors properly
- ❌ Hardcode values thay vì config
- ❌ Không test code
- ❌ Copy-paste code mà không hiểu

### Engagement Strategies

- 🎯 Real-world examples (security scanning)
- 💬 Group discussions (MVC vs Clean Architecture)
- 🔧 Hands-on challenges (implement new feature)
- 📈 Progress visualization (show test coverage growth)

---

## 📚 RESOURCES FOR STUDENTS

### Must Read

- [ ] CLEAN_ARCHITECTURE.MD
- [ ] CLEAN_CODE.MD
- [ ] GIT.MD
- [ ] API documentation (api.yml)

### Recommended

- [Effective Go](https://golang.org/doc/effective_go.html)
- [Go by Example](https://gobyexample.com/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)

### Tools

- VS Code + Go extension
- Postman
- Docker Desktop
- Git
- PostgreSQL client (DBeaver/pgAdmin)

---

## 🔄 CONTINUOUS IMPROVEMENT

### After Each Session

- Collect feedback forms
- Note difficult concepts
- Update code comments
- Improve explanations

### Post-Training Survey

- Overall satisfaction
- Pace (too fast/slow?)
- Most valuable session
- Suggestions for improvement

---

## ✅ SUCCESS METRICS

**Technical Skills:**

- ✅ Students có thể implement CRUD API
- ✅ Students hiểu Clean Architecture
- ✅ Students có thể viết tests
- ✅ Students có thể deploy với Docker

**Soft Skills:**

- ✅ Đọc và hiểu code người khác
- ✅ Debug và troubleshoot
- ✅ Ask good questions
- ✅ Collaborate với Git

---

**Note:** Tài liệu này là living document, cập nhật dựa trên feedback và experience thực tế!
