#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/crm-dashboard-backend"
ENV_FILE="$BACKEND_DIR/.env"

DB_NAME="salesflow_crm"
DB_USER="$(whoami)"
DB_HOST="localhost"
DB_PORT="${DB_PORT:-5433}"

echo "SalesFlow CRM — local PostgreSQL setup"
echo "========================================"
echo ""
echo "This script will:"
echo "  1. Create the database '$DB_NAME' (if missing)"
echo "  2. Update crm-dashboard-backend/.env with your credentials"
echo "  3. Run Prisma migrations and seed demo data"
echo ""
echo "Using PostgreSQL user: ${DB_USER:-$(whoami)} (leave password blank if using Postgres.app)"
echo ""

read -rsp "Enter your PostgreSQL password (press Enter if none): " DB_PASSWORD
echo ""
echo ""

DB_USER="${DB_USER:-$(whoami)}"

if [ -z "$DB_PASSWORD" ]; then
  export PGPASSWORD=""
  DB_URL="postgresql://${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
  # Postgres.app often accepts a bare localhost URL with no user/password
  DB_URL_FALLBACK="postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
else
  export PGPASSWORD="$DB_PASSWORD"
  ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$DB_PASSWORD''', safe=''))")
  DB_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
  DB_URL_FALLBACK="$DB_URL"
fi

if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" >/dev/null 2>&1; then
  echo "❌ PostgreSQL is not running on $DB_HOST:$DB_PORT"
  echo ""
  echo "Start it with:"
  echo "  brew services start postgresql@14"
  exit 1
fi

if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
  if [ -z "$DB_PASSWORD" ] && psql -h "$DB_HOST" -p "$DB_PORT" -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    DB_USER=""
    DB_URL="$DB_URL_FALLBACK"
  else
    echo "❌ Could not connect with those credentials."
    echo ""
    echo "Tips:"
    echo "  • Postgres.app: press Enter at the password prompt (no password needed)"
    echo "  • Homebrew: use the password you set during install"
    echo "  • Create a dedicated user in psql:"
    echo "      CREATE USER salesflow WITH PASSWORD 'yourpassword' CREATEDB;"
    echo "      CREATE DATABASE salesflow_crm OWNER salesflow;"
    exit 1
  fi
fi

echo "✅ Connected to PostgreSQL"

if psql -h "$DB_HOST" -p "$DB_PORT" ${DB_USER:+-U "$DB_USER"} -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1; then
  echo "ℹ️  Database '$DB_NAME' already exists"
else
  createdb -h "$DB_HOST" -p "$DB_PORT" ${DB_USER:+-U "$DB_USER"} "$DB_NAME"
  echo "✅ Created database '$DB_NAME'"
fi

# URL-encode password for connection string (handles special chars)
if [ -n "$DB_PASSWORD" ]; then
  ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('''$DB_PASSWORD''', safe=''))")
  DB_URL="postgresql://${DB_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
fi

cat > "$ENV_FILE" <<EOF
DATABASE_URL="${DB_URL}"
JWT_SECRET="salesflow-crm-dev-secret-key-2024"
PORT=3001
EOF

echo "✅ Updated $ENV_FILE"

cd "$BACKEND_DIR"
npm run db:setup

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Start the app:"
echo "  npm run dev:backend   # from project root"
echo "  npm run dev:frontend  # from project root"
