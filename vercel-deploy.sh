#!/usr/bin/env bash
# vercel-deploy.sh — Production deployment script for darkTunes Charts
#
# Usage:
#   ./vercel-deploy.sh             — Deploy to production
#   ./vercel-deploy.sh --preview   — Deploy to preview URL (for testing)
#
# Prerequisites:
#   - Node.js ≥ 20 and npm ≥ 9
#   - Vercel CLI installed globally: npm install -g vercel
#   - Vercel account authenticated: vercel login
#   - Environment variables configured in Vercel project settings
#     See: .env.example for the full variable reference

set -euo pipefail

# ---------------------------------------------------------------------------
# Color helpers (disabled when not a TTY)
# ---------------------------------------------------------------------------
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' CYAN='' BOLD='' RESET=''
fi

info()    { echo -e "${CYAN}ℹ${RESET}  $*"; }
success() { echo -e "${GREEN}✔${RESET}  $*"; }
warn()    { echo -e "${YELLOW}⚠${RESET}  $*"; }
error()   { echo -e "${RED}✘${RESET}  $*" >&2; }
step()    { echo -e "\n${BOLD}$*${RESET}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

PREVIEW_MODE=false
if [[ "${1:-}" == "--preview" ]]; then
  PREVIEW_MODE=true
fi

echo -e "${BOLD}"
echo "  ██████╗  █████╗ ██████╗ ██╗  ██╗████████╗██╗   ██╗███╗   ██╗███████╗███████╗"
echo "  ██╔══██╗██╔══██╗██╔══██╗██║ ██╔╝╚══██╔══╝██║   ██║████╗  ██║██╔════╝██╔════╝"
echo "  ██║  ██║███████║██████╔╝█████╔╝    ██║   ██║   ██║██╔██╗ ██║█████╗  ███████╗"
echo "  ██║  ██║██╔══██║██╔══██╗██╔═██╗   ██║   ██║   ██║██║╚██╗██║██╔══╝  ╚════██║"
echo "  ██████╔╝██║  ██║██║  ██║██║  ██╗  ██║   ╚██████╔╝██║ ╚████║███████╗███████║"
echo "  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═╝    ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚══════╝"
echo -e "${RESET}"
echo -e "  ${CYAN}Charts${RESET} — Fair · Transparent · Innovative\n"

if $PREVIEW_MODE; then
  info "Mode: PREVIEW deployment"
else
  info "Mode: PRODUCTION deployment"
fi

# ---------------------------------------------------------------------------
# Step 1: Tool pre-flight checks
# ---------------------------------------------------------------------------
step "1/6  Pre-flight checks"

NODE_OK=true
NPM_OK=true
VERCEL_OK=true

if ! command -v node &>/dev/null; then
  error "Node.js is not installed. Install from https://nodejs.org/ (≥ 20.x required)"
  NODE_OK=false
else
  NODE_VERSION=$(node --version | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt 20 ]; then
    warn "Node.js version $NODE_VERSION detected. Version 20+ is required."
  else
    success "Node.js $NODE_VERSION"
  fi
fi

if ! command -v npm &>/dev/null; then
  error "npm is not installed."
  NPM_OK=false
else
  success "npm $(npm --version)"
fi

if ! command -v vercel &>/dev/null; then
  warn "Vercel CLI not found. Installing globally..."
  npm install -g vercel@latest
  if ! command -v vercel &>/dev/null; then
    error "Vercel CLI installation failed. Run: npm install -g vercel"
    VERCEL_OK=false
  else
    success "Vercel CLI installed: $(vercel --version)"
  fi
else
  success "Vercel CLI $(vercel --version)"
fi

if [ "$NODE_OK" = false ] || [ "$NPM_OK" = false ] || [ "$VERCEL_OK" = false ]; then
  error "Pre-flight checks failed. Fix the issues above and retry."
  exit 1
fi

# ---------------------------------------------------------------------------
# Step 2: Install dependencies
# ---------------------------------------------------------------------------
step "2/6  Installing dependencies"
npm ci --prefer-offline 2>&1 | tail -10
success "Dependencies installed"

# ---------------------------------------------------------------------------
# Step 3: TypeScript type check
# ---------------------------------------------------------------------------
step "3/6  TypeScript type check"
if npx tsc --noEmit 2>&1; then
  success "No TypeScript errors"
else
  error "TypeScript errors found. Fix them before deploying."
  exit 1
fi

# ---------------------------------------------------------------------------
# Step 4: Run tests
# ---------------------------------------------------------------------------
step "4/6  Running test suite"
TEST_OUTPUT=$(npm test 2>&1)
TEST_EXIT=$?
if [ $TEST_EXIT -eq 0 ]; then
  PASS_COUNT=$(echo "$TEST_OUTPUT" | grep -oP 'Tests\s+\K\d+(?= passed)' || echo "?")
  success "All tests passed ($PASS_COUNT tests)"
else
  echo "$TEST_OUTPUT"
  error "Tests failed. Fix failing tests before deploying."
  exit 1
fi

# ---------------------------------------------------------------------------
# Step 5: Production build
# ---------------------------------------------------------------------------
step "5/6  Building for production"
if npm run build 2>&1 | grep -E "^(\.next/|✓ Compiled|Route \(app\))"; then
  success "Production build complete"
else
  BUILD_EXIT=${PIPESTATUS[0]}
  if [ "$BUILD_EXIT" -ne 0 ]; then
    error "Build failed."
    exit 1
  fi
  success "Production build complete"
fi

# ---------------------------------------------------------------------------
# Step 6: Deploy to Vercel
# ---------------------------------------------------------------------------
step "6/6  Deploying to Vercel"

if $PREVIEW_MODE; then
  info "Deploying to preview environment..."
  DEPLOY_URL=$(vercel --yes 2>&1 | grep -oP 'https://[^\s]+' | tail -1)
  if [ -n "$DEPLOY_URL" ]; then
    success "Preview deployed: ${CYAN}${DEPLOY_URL}${RESET}"
  else
    warn "Deployment may have succeeded — check Vercel dashboard."
  fi
else
  info "Deploying to production..."
  DEPLOY_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^\s]+' | tail -1)
  if [ -n "$DEPLOY_URL" ]; then
    success "Production deployed: ${CYAN}${DEPLOY_URL}${RESET}"
  else
    warn "Deployment may have succeeded — check Vercel dashboard."
  fi
fi

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo ""
echo -e "${GREEN}${BOLD}  ✔ Deployment complete!${RESET}"
echo ""
echo -e "  ${CYAN}Next steps:${RESET}"
echo -e "  • Verify environment variables in Vercel project settings"
echo -e "    SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET (see .env.example)"
echo -e "  • Check the Vercel dashboard for function logs"
echo -e "  • Review docs/HANDBUCH_DE.md or docs/MANUAL_EN.md for operations guide"
echo ""
