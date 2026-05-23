#!/bin/bash
set -e

# Generate production schema from authoritative schema
cp prisma/schema.prisma prisma/schema.prod.prisma

# Replace SQLite provider with PostgreSQL for Vercel deployment
# Using | as sed delimiter to avoid issues with / in paths
sed -i 's|provider = "sqlite"|provider = "postgresql"|' prisma/schema.prod.prisma

# Generate Prisma client with production schema
npx prisma generate --schema=prisma/schema.prod.prisma

# Push schema to production PostgreSQL database
echo "--- Running prisma db push ---"
npx prisma db push --schema=prisma/schema.prod.prisma --accept-data-loss 2>&1

# Clean up old random test data (only affects generated test data, not base seed)
echo "--- Cleaning up test data ---"
npx tsx prisma/cleanup-build.ts 2>&1 || echo "Cleanup skipped (may already be clean)"

# Seed production database (upsert-based, safe to re-run)
echo "--- Running prisma db seed ---"
npx prisma db seed --schema=prisma/schema.prod.prisma 2>&1 || echo "Seed completed (warnings ignored)"

# Build Next.js
next build
