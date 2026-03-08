# 📄 SOFTWARE REQUIREMENT SPECIFICATION

## Mini Attack Surface Management (Mini ASM)

## 1. INTRODUCTION

### 1.1 Purpose

Tài liệu này mô tả yêu cầu cho hệ thống Mini Attack Surface Management (ASM) — một service giúp quản lý các tài sản (assets) public-facing của tổ chức.

Hệ thống phục vụ mục đích:

- Theo dõi domain, IP, service đang public
- Quản lý trạng thái hoạt động
- Là nền tảng để mở rộng sang security monitoring

### 1.2 Definitions

| Term  | Meaning                                     |
| ----- | ------------------------------------------- |
| Asset | Một tài nguyên public (domain, IP, service) |
| ASM   | Attack Surface Management                   |
| MVP   | Minimum Viable Product                      |

## 2. OVERALL DESCRIPTION

### 2.1 Product Perspective

Hệ thống hoạt động độc lập, có thể được tích hợp với:

- Monitoring tools
- Scanner tools
- Frontend dashboard

## 3. FUNCTIONAL REQUIREMENTS

### 3.1 Asset Management

**FR-1: Create Asset**

- Hệ thống phải cho phép tạo mới một asset
- Validate input (name không empty, type hợp lệ)
- Tự động generate UUID cho asset
- Tự động set created_at timestamp
- Default status là "active"

**FR-2: List Assets**

- Hệ thống phải trả về danh sách toàn bộ asset
- Sắp xếp theo thời gian tạo (mới nhất trước)

**FR-3: Get Single Asset**

- Hệ thống phải cho phép lấy thông tin chi tiết một asset theo ID
- Trả về 404 nếu không tìm thấy

**FR-4: Update Asset**

- Hệ thống phải cho phép cập nhật thông tin asset
- Có thể cập nhật: name, type, status
- Không cho phép thay đổi: id, created_at
- Trả về 404 nếu không tìm thấy

**FR-5: Delete Asset**

- Hệ thống phải cho phép xóa asset theo ID
- Trả về 404 nếu không tìm thấy

**FR-6: Filter Assets**

- Hệ thống phải hỗ trợ filter theo type
- Hệ thống phải hỗ trợ filter theo status
- Có thể combine nhiều filters

**FR-7: Search Assets**

- Hệ thống phải hỗ trợ search theo name (partial match)

**FR-8: Health Check**

- Hệ thống phải cung cấp endpoint kiểm tra trạng thái service
- Check database connection

## 4. NON-FUNCTIONAL REQUIREMENTS

### 4.1 Performance

- Hệ thống phải xử lý ít nhất 100 request/giây trong môi trường local
- Response time trung bình < 200ms

### 4.2 Security

- Không trả stack trace ra client
- Validate input đầy đủ
- Không panic
- Không expose internal struct

### 4.3 Maintainability

- Phải có cấu trúc project rõ ràng
- Separation of concerns (handler/service/storage)
- Code phải tuân thủ clean code
- Naming rõ ràng

### 4.4 Logging

- Log mỗi HTTP request
- Log error rõ ràng
- Không log sensitive data

### 4.5 API Design

- Sử dụng RESTful convention
- Sử dụng HTTP status code đúng:
  - 200 OK - Request thành công
  - 201 Created - Resource được tạo thành công
  - 400 Bad Request - Input không hợp lệ
  - 404 Not Found - Resource không tồn tại
  - 500 Internal Server Error - Lỗi server

### 4.6 Testing

- Unit test coverage ≥ 70%
- Integration tests cho tất cả endpoints
- Test cases cho edge cases và error scenarios

## 5. DATA MODEL

### 5.1 Asset

| Field      | Type          | Description       | Required | Constraints                            |
| ---------- | ------------- | ----------------- | -------- | -------------------------------------- |
| id         | string (UUID) | Unique identifier | Yes      | Auto-generated                         |
| name       | string        | Asset name        | Yes      | 1-255 characters                       |
| type       | string        | Asset type        | Yes      | enum: domain/ip/service                |
| status     | string        | Asset status      | Yes      | enum: active/inactive, default: active |
| created_at | timestamp     | Creation time     | Yes      | Auto-generated                         |
| updated_at | timestamp     | Last update time  | No       | Auto-updated                           |

**Ví dụ:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "example.com",
  "type": "domain",
  "status": "active",
  "created_at": "2026-03-02T10:30:00Z",
  "updated_at": "2026-03-02T10:30:00Z"
}
```

## 6. PROJECT STRUCTURE

```
mini-asm/
├── cmd/
│   └── server/
│       └── main.go          # Entry point
├── internal/
│   ├── handler/             # HTTP handlers
│   ├── service/             # Business logic
│   ├── storage/             # Data access layer
│   │   ├── memory/          # In-memory implementation
│   │   └── postgres/        # Database implementation
│   └── model/               # Data models
├── test/                    # Integration tests
├── web/                     # Frontend files
├── go.mod
└── README.md
```

## 7. LEARNING OBJECTIVES

### Buổi 1: Foundation & Theory

- Hiểu software development lifecycle
- Sử dụng Git cơ bản (clone, commit, push, pull)
- Nắm được Go syntax và conventions

### Buổi 2: API Development Basics

- Thiết lập Go project structure
- Implement HTTP server với standard library
- Implement in-memory storage
- Create và test RESTful endpoints

### Buổi 3: Database Integration

- Connect Go application với database
- Implement CRUD với SQL
- Sử dụng database migration tools

### Buổi 4: Advanced Features

- Complete REST API với full CRUD
- Implement filtering và searching
- Advanced validation

### Buổi 5: Quality Assurance

- Viết unit tests với Go testing package
- Integration testing strategies
- Error handling patterns

### Buổi 6: Integration & Deployment

- Integrate backend với simple frontend
- API documentation với OpenAPI
- Containerize với Docker
- Deploy to local/cloud environment
