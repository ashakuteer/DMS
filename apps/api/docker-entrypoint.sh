#!/bin/sh

echo "=== Running database migrations ==="
timeout 60 /app/node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma && \
  echo "=== Migrations applied ===" || \
  echo "WARN: prisma migrate deploy timed out or failed — starting server anyway ==="

echo "=== Starting application ==="
exec "$@"
