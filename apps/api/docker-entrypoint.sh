#!/bin/sh
set -e

echo "=== Running database migrations ==="
/app/node_modules/.bin/prisma migrate deploy --schema=/app/prisma/schema.prisma
echo "=== Migrations complete. Starting application ==="

exec "$@"
