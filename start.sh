#!/bin/bash

export COREPACK_ENABLE_STRICT=0

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== NGO Donor Management System ==="
echo "Root: $ROOT_DIR"

# Kill any processes on our ports
echo "Clearing ports 3001 and 5000..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
sleep 1

# Install shared package if needed
if [ ! -d "$ROOT_DIR/packages/shared/node_modules" ]; then
  echo "Installing shared package dependencies..."
  cd "$ROOT_DIR/packages/shared"
  npm install --legacy-peer-deps --no-package-lock 2>&1 | tail -5
fi

# Install API dependencies if needed
if [ ! -d "$ROOT_DIR/apps/api/node_modules/@nestjs/core" ]; then
  echo "Installing API dependencies..."
  cd "$ROOT_DIR/apps/api"
  npm install --legacy-peer-deps --no-package-lock 2>&1 | tail -5
fi

# Install additional API packages if needed
if [ ! -d "$ROOT_DIR/apps/api/node_modules/pdfkit" ]; then
  echo "Installing additional API packages..."
  cd "$ROOT_DIR/apps/api"
  npm install pdfkit @types/pdfkit xlsx @supabase/supabase-js --legacy-peer-deps --no-package-lock 2>&1 | tail -5
fi

# Install Web dependencies (always check)
if [ ! -f "$ROOT_DIR/apps/web/node_modules/.bin/next" ]; then
  echo "Installing Web dependencies..."
  cd "$ROOT_DIR/apps/web"
  npm install --legacy-peer-deps --no-package-lock 2>&1 | tail -5
fi

# Generate Prisma client if needed
if [ ! -f "$ROOT_DIR/apps/api/node_modules/.prisma/client/index.js" ]; then
  echo "Generating Prisma client..."
  cd "$ROOT_DIR/apps/api"
  npx prisma generate --schema=prisma/schema.prisma 2>&1 | tail -3
fi

# Push database schema
echo "Syncing database schema..."
cd "$ROOT_DIR/apps/api"
npx prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss 2>&1 | tail -3

echo ""
echo "Starting NestJS API on port 3001..."
cd "$ROOT_DIR/apps/api"
# Set API_PORT explicitly to override any global PORT env variable
API_PORT=3001 node_modules/.bin/nest start --watch &
API_PID=$!

echo "Waiting for API to initialize (12s)..."
sleep 12

echo "Starting Next.js frontend on port 5000..."
cd "$ROOT_DIR/apps/web"
# Use local next binary to avoid downloading latest version
PORT=5000 node_modules/.bin/next dev -p 5000 &
WEB_PID=$!

echo "Both services started. API PID: $API_PID, Web PID: $WEB_PID"

# Cleanup on exit
cleanup() {
  echo "Shutting down..."
  kill $API_PID 2>/dev/null || true
  kill $WEB_PID 2>/dev/null || true
  lsof -ti:3001 | xargs kill -9 2>/dev/null || true
  lsof -ti:5000 | xargs kill -9 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM

wait $API_PID $WEB_PID
