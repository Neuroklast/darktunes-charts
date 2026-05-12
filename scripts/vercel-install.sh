#!/bin/bash
set -e

echo "→ Installing dependencies..."
npm ci

echo "→ Validating required environment variables..."
required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "DATABASE_URL"
)
for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "ERROR: Required environment variable '$var' is not set."
    exit 1
  fi
done

echo "✓ All required environment variables are set."
echo "✓ Install complete."
