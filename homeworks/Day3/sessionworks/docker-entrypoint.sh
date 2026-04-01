#!/bin/sh
set -e

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_NAME="${DB_NAME:-mini_asm}"

# ── Wait for PostgreSQL ────────────────────────────────────────────────────────
echo "⏳ Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# ── Run migrations ─────────────────────────────────────────────────────────────
# All migration files use CREATE TABLE IF NOT EXISTS, so re-running is safe.
echo "🔄 Applying migrations..."
for f in $(ls migrations/*.up.sql | sort); do
  echo "   → $f"
  PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" -p "$DB_PORT" \
    -U "$DB_USER" -d "$DB_NAME" \
    -f "$f" \
    -v ON_ERROR_STOP=0 \
    --quiet
done
echo "✅ Migrations done"

# ── Start server ───────────────────────────────────────────────────────────────
echo "🚀 Starting Mini ASM server on port ${SERVER_PORT:-8080}..."
exec ./server
