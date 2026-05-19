#!/bin/bash
set -e

echo "=== Factory MES Startup ==="

# Generate Prisma client
echo ">>> Generating Prisma client..."
npx prisma generate

# Run database migrations
echo ">>> Running database migrations..."
if npx prisma migrate deploy 2>/dev/null; then
  echo "Migrations applied successfully"
else
  echo "No existing migrations found, using db push..."
  npx prisma db push
fi

# Seed database (only if empty)
echo ">>> Seeding database..."
# Check if admin user exists to avoid re-seeding
npx prisma db seed 2>/dev/null || echo "Seed skipped or already seeded"

# Start the application
echo ">>> Starting application..."
npx next start -p ${PORT:-3000}
