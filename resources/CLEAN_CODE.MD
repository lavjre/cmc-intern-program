# 🎯 CLEAN CODE PRINCIPLES

> "Clean code is simple and direct. Clean code reads like well-written prose."  
> — Robert C. Martin

---

## 📋 MỤC LỤC

1. [**NGUYÊN TẮC CỐT LÕI**](#1-nguyên-tắc-cốt-lõi)
   - [1.1 Đặt Tên Có Ý Nghĩa](#11-đặt-tên-có-ý-nghĩa)
   - [1.2 Function Phải Nhỏ Gọn](#12-function-phải-nhỏ-gọn)
   - [1.3 Đừng Lặp Lại Code (DRY)](#13-đừng-lặp-lại-code-dry)
   - [1.4 Xử Lý Error Là Một Việc Riêng](#14-xử-lý-error-là-một-việc-riêng)
   - [1.5 Comment Giải Thích TẠI SAO, Không Phải LÀ GÌ](#15-comment-giải-thích-tại-sao-không-phải-là-gì)

2. [**BEST PRACTICES CHO GO**](#2-best-practices-cho-go)
   - [2.1 Thiết Kế Package](#21-thiết-kế-package)
   - [2.2 Xử Lý Error](#22-xử-lý-error)
   - [2.3 Thiết Kế Interface](#23-thiết-kế-interface)
   - [2.4 Thiết Kế Struct](#24-thiết-kế-struct)
   - [2.5 Testing](#25-testing)

3. [**CLEAN CODE THEO LAYERS**](#3-clean-code-theo-layers)
   - [Handler Layer](#handler-layer)
   - [Service Layer](#service-layer)
   - [Storage Layer](#storage-layer)

4. [**CODE SMELLS CẦN TRÁNH**](#4-code-smells-cần-tránh)

5. [**CHECKLIST KHI REFACTOR**](#5-checklist-khi-refactor)

6. [**VÍ DỤ TRƯỚC & SAU**](#6-ví-dụ-trước--sau)

7. [**THÓI QUEN HÀNG NGÀY**](#7-thói-quen-hàng-ngày)

8. [**ĐIỂM CHÍNH CẦN NHỚ**](#-điểm-chính-cần-nhớ)

9. [**TÀI LIỆU THAM KHẢO**](#-tài-liệu-tham-khảo)

---

## 1. NGUYÊN TẮC CỐT LÕI

### 1.1 Đặt Tên Có Ý Nghĩa

**Quy tắc:**

- Tên phải reveal intent - thể hiện ý định
- Tránh disinformation - thông tin sai lệch
- Có thể phát âm và search được
- Không dùng abbreviation không cần thiết

**Ví dụ:**

```go
// ❌ Bad
var d int  // elapsed time in days

// ✅ Good
var elapsedTimeInDays int
var daysSinceCreation int
```

### 1.2 Function Phải Nhỏ Gọn

**Quy tắc:**

- Function chỉ làm MỘT việc
- Độ dài lý tưởng: 5-15 dòng
- Level of abstraction phải nhất quán
- Nếu function có nhiều hơn 3-4 parameters → xem xét dùng struct

**Ví dụ:**

```go
// ❌ Bad: Làm quá nhiều việc
func ProcessOrder(orderId, userId, productId, qty int, addr string) error {
    // Validate user
    // Check inventory
    // Calculate price
    // Process payment
    // Update database
    // Send email
    return nil
}

// ✅ Good: Single responsibility
func ProcessOrder(order Order) error {
    if err := validateOrder(order); err != nil {
        return err
    }
    if err := checkInventory(order); err != nil {
        return err
    }
    return completeOrder(order)
}
```

### 1.3 Đừng Lặp Lại Code (DRY)

**Quy tắc:**

- Mỗi piece of knowledge chỉ xuất hiện một lần
- Duplicate code là nguồn gốc của bugs
- Refactor khi thấy pattern lặp lại

### 1.4 Xử Lý Error Là Một Việc Riêng

**Quy tắc:**

- Function xử lý error hoặc làm một việc khác, không cả hai
- Không ignore errors
- Không return nil khi có thể return error
- Use error wrapping để preserve context

**Ví dụ:**

```go
// ✅ Good
func CreateAsset(name, assetType string) (*Asset, error) {
    if name == "" {
        return nil, errors.New("name is required")
    }

    asset, err := buildAsset(name, assetType)
    if err != nil {
        return nil, fmt.Errorf("build asset: %w", err)
    }

    return asset, nil
}
```

### 1.5 Comment Giải Thích TẠI SAO, Không Phải LÀ GÌ

**Quy tắc:**

- Code tốt là self-documenting
- Comment giải thích business logic, quyết định kiến trúc
- Tránh comment redundant
- Update comment khi update code

**Ví dụ:**

```go
// ❌ Bad: Obvious
// Loop through all assets
for _, asset := range assets {
    // ...
}

// ✅ Good: Explain why
// We process inactive assets first to free up resources
// before handling high-priority active assets
for _, asset := range inactiveAssets {
    // ...
}
```

---

## 2. BEST PRACTICES CHO GO

### 2.1 Thiết Kế Package

- Organize by feature/domain, not by type
- Package name nên ngắn, lowercase, no underscore
- Avoid util/common packages

### 2.2 Xử Lý Error

- Return errors, đừng panic (except trong init hoặc unrecoverable)
- Use `errors.Is()` và `errors.As()` để check error types
- Wrap errors với context: `fmt.Errorf("operation failed: %w", err)`

### 2.3 Thiết Kế Interface

- Accept interfaces, return structs
- Interface nên nhỏ (1-3 methods is ideal)
- Define interface ở nơi sử dụng, không phải implement

**Ví dụ:**

```go
// ✅ Good: Small, focused interface
type Storage interface {
    Get(id string) (*Asset, error)
    Save(asset *Asset) error
}

// Consumer defines what it needs
func ProcessAsset(store Storage, id string) error {
    asset, err := store.Get(id)
    if err != nil {
        return err
    }
    // Process...
    return store.Save(asset)
}
```

### 2.4 Thiết Kế Struct

- Zero value should be useful
- Provide constructor functions cho complex initialization
- Use struct tags cho serialization

### 2.5 Testing

- Table-driven tests
- Test behavior, not implementation
- Use meaningful test names: `TestFunction_Scenario_ExpectedBehavior`

---

## 3. CLEAN CODE IN LAYERS

### Handler Layer

**Focus:** HTTP concerns only

- Parse request → validate input → call service → format response
- Đừng viết business logic ở đây
- Consistent error response format

### Service Layer

**Focus:** Business logic & orchestration

- Input validation (business rules)
- Coordinate operations
- Transaction management
- Error handling & logging

### Storage Layer

**Focus:** Data persistence

- Database queries
- Data mapping
- Connection management
- Transaction handling

**Ví dụ clean separation:**

```go
// Handler: HTTP only
func (h *Handler) CreateAsset(w http.ResponseWriter, r *http.Request) {
    var req CreateAssetRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        RespondError(w, 400, "invalid JSON")
        return
    }

    asset, err := h.service.CreateAsset(req.Name, req.Type)
    if err != nil {
        RespondError(w, 400, err.Error())
        return
    }

    RespondJSON(w, 201, asset)
}

// Service: Business logic
func (s *Service) CreateAsset(name, assetType string) (*Asset, error) {
    if err := s.validateInput(name, assetType); err != nil {
        return nil, err
    }

    asset := &Asset{
        ID:     uuid.New().String(),
        Name:   name,
        Type:   assetType,
        Status: "active",
    }

    if err := s.storage.Save(asset); err != nil {
        return nil, fmt.Errorf("save asset: %w", err)
    }

    return asset, nil
}

// Storage: Data access only
func (s *Storage) Save(asset *Asset) error {
    query := `INSERT INTO assets (id, name, type, status) VALUES ($1, $2, $3, $4)`
    _, err := s.db.Exec(query, asset.ID, asset.Name, asset.Type, asset.Status)
    return err
}
```

---

## 4. CODE SMELLS CẦN TRÁNH

### 🚨 Common Bad Practices

| Bad Practice               | Why Bad                   | Fix                              |
| -------------------------- | ------------------------- | -------------------------------- |
| Long functions (>50 lines) | Hard to understand & test | Break into smaller functions     |
| Deep nesting (>3 levels)   | Cognitive overload        | Early returns, extract functions |
| Magic numbers              | Unclear meaning           | Use named constants              |
| Global variables           | Hidden dependencies       | Pass as parameters or use DI     |
| Ignored errors             | Silent failures           | Always handle errors             |
| God objects                | Too many responsibilities | Split into focused objects       |
| Dead code                  | Confusing, unmaintained   | Delete it                        |

### 🎯 Red Flags

```go
// ❌ Deep nesting
func Process(data Data) error {
    if data != nil {
        if data.IsValid() {
            if data.HasPermission() {
                if !data.IsLocked() {
                    // actual logic here
                }
            }
        }
    }
}

// ✅ Early returns
func Process(data Data) error {
    if data == nil {
        return errors.New("data is nil")
    }
    if !data.IsValid() {
        return errors.New("invalid data")
    }
    if !data.HasPermission() {
        return errors.New("no permission")
    }
    if data.IsLocked() {
        return errors.New("data is locked")
    }

    // actual logic here - no nesting
    return nil
}
```

---

## 5. CHECKLIST KHI REFACTOR

Khi refactor code, hỏi những câu hỏi sau:

### Naming

- [ ] Variable/function names có clear không?
- [ ] Có thể hiểu code mà không cần comment không?

### Functions

- [ ] Function chỉ làm 1 việc?
- [ ] Function length < 20 lines?
- [ ] Parameters < 4?

### Complexity

- [ ] Nesting depth < 3 levels?
- [ ] Có duplicate code không?
- [ ] Có magic numbers không?

### Error Handling

- [ ] All errors được handle?
- [ ] Error messages có helpful không?
- [ ] Error context được preserve?

### Testing

- [ ] Code có testable không?
- [ ] Test coverage đủ?
- [ ] Tests có clear không?

---

## 6. VÍ DỤ TRƯỚC & SAU

### ❌ Before: Messy Code

```go
func CA(n, t, s string, db *sql.DB) error {
    if n == "" || t == "" {
        return errors.New("invalid input")
    }
    id := uuid.New().String()
    if t != "domain" && t != "ip" && t != "service" {
        return errors.New("bad type")
    }
    tx, _ := db.Begin()
    _, e := tx.Exec("INSERT INTO assets VALUES (?, ?, ?, ?)", id, n, t, s)
    if e != nil {
        tx.Rollback()
        return e
    }
    tx.Commit()
    log.Println("Created asset: " + id)
    return nil
}
```

### ✅ After: Clean Code

```go
func CreateAsset(name, assetType string) (*Asset, error) {
    if err := validateAssetInput(name, assetType); err != nil {
        return nil, err
    }

    asset := buildAsset(name, assetType)

    if err := saveAsset(asset); err != nil {
        return nil, fmt.Errorf("failed to save asset: %w", err)
    }

    log.Info("asset created", "id", asset.ID, "name", asset.Name)
    return asset, nil
}

func validateAssetInput(name, assetType string) error {
    if name == "" {
        return ErrNameRequired
    }
    if !isValidAssetType(assetType) {
        return ErrInvalidAssetType
    }
    return nil
}

func buildAsset(name, assetType string) *Asset {
    return &Asset{
        ID:        uuid.New().String(),
        Name:      name,
        Type:      assetType,
        Status:    StatusActive,
        CreatedAt: time.Now(),
    }
}
```

**Improvements:**

- ✅ Clear function names
- ✅ Single responsibility
- ✅ Proper error handling
- ✅ No magic strings
- ✅ Structured logging
- ✅ Easy to test

---

## 7. THÓI QUEN HÀNG NGÀY

### Khi viết code mới:

1. **Think before you code** - plan structure trước
2. **Write the simplest thing that works** - đừng over-engineer
3. **One thing at a time** - complete một feature rồi mới sang feature khác
4. **Test as you go** - đừng để test đến cuối

### Khi review code:

1. **Readability first** - code có dễ đọc không?
2. **Question complexity** - có cách đơn giản hơn không?
3. **Check error paths** - errors có được handle đúng không?
4. **Look for patterns** - có opportunity để refactor không?

### Khi đọc code của người khác:

1. Hiểu high-level structure trước
2. Đọc tests để hiểu expected behavior
3. Trace through một happy path
4. Identify edge cases và error handling

---

## 📚 ĐIỂM CHÍNH CẦN NHỚ

1. **Clean code reads like prose** - người khác có thể hiểu nhanh
2. **Functions do one thing** - small, focused, well-named
3. **Handle errors explicitly** - never ignore, always add context
4. **No magic** - constants cho numbers, clear names cho variables
5. **Test-driven mindset** - nếu khó test, code có vấn đề
6. **Refactor continuously** - leave code better than you found it

---

## 📖 TÀI LIỆU THAM KHẢO

- **Clean Code** by Robert C. Martin
- **Effective Go**: https://go.dev/doc/effective_go
- **Go Code Review Comments**: https://github.com/golang/go/wiki/CodeReviewComments
- **Uber Go Style Guide**: https://github.com/uber-go/guide

---

> "Any fool can write code that a computer can understand.  
> Good programmers write code that humans can understand."  
> — Martin Fowler
