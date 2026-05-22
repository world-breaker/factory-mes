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
npx prisma db push --schema=prisma/schema.prod.prisma --accept-data-loss

# Build Next.js
next build
