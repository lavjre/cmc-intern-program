# cmc-intern-program

Huong dan cai dat va chay project trong repo nay.

## Tong quan

Repo nay chua bai tap va session work cho chuong trinh intern. Phan project chay duoc day du nhat hien tai nam o:

- `homeworks/Day3/sessionworks`

Stack cua project nay:

- Backend: Go
- Frontend: React + Vite
- Database: PostgreSQL
- Deploy local: Docker Compose

## Cau truc repo

```text
.
|- app/
|- homeworks/
|  |- Day2/
|  `- Day3/
|     |- HOMEWORK.MD
|     |- sessionworks/
|     `- submissions/
|- resources/
|- Day3_TUTORIAL.md
`- README.md
```

Neu ban muon chay ung dung, hay vao `homeworks/Day3/sessionworks`.

## Yeu cau moi truong

### Cach 1: Chay bang Docker

Can cai:

- Docker Desktop hoac Docker Engine
- Docker Compose plugin

### Cach 2: Chay local de dev

Can cai:

- Go `1.23+`
- Node.js `20+`
- npm
- PostgreSQL `15+` hoac chay DB bang Docker

## Quick Start bang Docker

Day la cach nhanh nhat de chay full stack.

### PowerShell

```powershell
Set-Location D:\workspace\cmc-intern-program\homeworks\Day3\sessionworks
docker compose up -d --build
docker compose ps
curl.exe http://localhost:8081/health
Start-Process "http://localhost:3000"
```

### Bash

```bash
cd homeworks/Day3/sessionworks
docker compose up -d --build
docker compose ps
curl http://localhost:8081/health
```

Sau khi chay xong:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:8081/health`
- PostgreSQL tren host: `localhost:5433`

### Dung stack

```bash
cd homeworks/Day3/sessionworks
docker compose down
```

### Reset database

```bash
cd homeworks/Day3/sessionworks
docker compose down -v
docker compose up -d --build
```

## Chay local de dev

Neu ban muon chay backend va frontend rieng de debug:

### 1. Start PostgreSQL

Cach de nhat la chi chay DB bang Docker:

```bash
cd homeworks/Day3/sessionworks
docker compose up -d db
```

### 2. Cau hinh backend

Tao file `.env` trong `homeworks/Day3/sessionworks` neu chua co:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mini_asm
SERVER_PORT=8080
```

### 3. Chay backend

```bash
cd homeworks/Day3/sessionworks
go mod tidy
go run ./cmd/server
```

Backend se lang nghe tai:

- `http://localhost:8080`
- `http://localhost:8080/health`

### 4. Chay frontend

```bash
cd homeworks/Day3/sessionworks/frontend
npm ci
npm run dev
```

Frontend dev server chay tai:

- `http://localhost:3000`

Vite da proxy `/api` sang `http://localhost:8080`, nen mo frontend trong browser la dung duoc ngay.

## Test nhanh

### Kiem tra health

```bash
curl http://localhost:8081/health
```

Neu chay backend local thay vi Docker:

```bash
curl http://localhost:8080/health
```

### Chay test backend

```bash
cd homeworks/Day3/sessionworks
go test -v -cover ./internal/model/test/ ./internal/scanner/ ./internal/validator/
```

### Build frontend

```bash
cd homeworks/Day3/sessionworks/frontend
npm ci
npm run build
```

## API va tai lieu lien quan

- Homework yeu cau: `homeworks/Day3/HOMEWORK.MD`
- Session guide: `homeworks/Day3/sessionworks/README.md`
- Docker guide: `homeworks/Day3/sessionworks/DOCKER.md`
- API schema: `homeworks/Day3/sessionworks/docs/api.yml`
- Day 3 tutorial: `Day3_TUTORIAL.md`

## Su co thuong gap

- `port is already allocated`: doi port trong `docker-compose.yml` hoac tat service dang chiem port
- Backend khong noi duoc DB: kiem tra DB da chay chua, va neu chay local thi `DB_PORT` nen la `5433`
- Frontend khong goi duoc API: dam bao backend dang chay o `8080` khi dev local, hoac dung frontend qua Docker o `3000`
- Bang DB chua duoc tao: chay lai `docker compose down -v` roi `docker compose up -d --build`

## Lenh huu ich

```bash
cd homeworks/Day3/sessionworks
docker compose logs -f backend
docker compose logs -f db
docker compose logs -f frontend
```

```bash
cd homeworks/Day3/sessionworks
docker compose ps
```
