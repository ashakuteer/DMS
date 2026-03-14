#!/bin/sh

echo "=== Running database migrations ==="
/app/node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma && \
  echo "=== Migrations applied ===" || \
  echo "WARN: prisma migrate deploy failed or had warnings — app will apply schema patches on startup ==="

echo "=== Starting application ==="
exec "$@"
