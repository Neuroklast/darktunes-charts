#!/usr/bin/env bash
# vercel-deploy.sh – Production deployment script for darkTunes Charts
# Usage: ./vercel-deploy.sh [--preview]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🎵 darkTunes Charts – Vercel Deployment"
echo "========================================"

if ! command -v node &>/dev/null; then
  echo "❌ Node.js is required" >&2
  exit 1
fi

if ! command -v npm &>/dev/null; then
  echo "❌ npm is required" >&2
  exit 1
fi

echo "📦 Installing dependencies..."
npm ci

echo "🔍 Type-checking..."
npx tsc --noEmit

echo "🧪 Running tests..."
npm test

echo "🏗️  Building frontend..."
npm run build

if [[ "${1:-}" == "--preview" ]]; then
  echo "🚀 Deploying to preview..."
  npx vercel --yes
else
  echo "🚀 Deploying to production..."
  npx vercel --prod --yes
fi

echo "✅ Deployment complete!"
