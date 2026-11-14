#!/usr/bin/env bash

# ==============================================================================
# Sai Yogi Crackers - VPS Deployment Script
# ==============================================================================
# Usage on VPS:
#   chmod +x deploy.sh
#   ./deploy.sh
# ==============================================================================

set -euo pipefail

# ANSI color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() {
  echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

echo -e "${BLUE}"
echo "========================================================"
echo "    🚀 Starting Sai Yogi Crackers Redeployment         "
echo "========================================================"
echo -e "${NC}"

# 1. Project Directory Resolution
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
log_info "Working directory: $PROJECT_DIR"

# 2. Git Pull Latest Code
log_info "Fetching latest code from Git..."
if [ -d ".git" ]; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
  log_info "Current Git branch: $CURRENT_BRANCH"
  git pull origin "$CURRENT_BRANCH"
  log_success "Git repository updated successfully."
else
  log_warn "Not a git repository or .git folder not found. Skipping git pull."
fi

# 3. Frontend Installation & Build
log_info "Installing root / frontend dependencies..."
npm install

log_info "Building production frontend (Vite)..."
npm run build
log_success "Frontend built successfully -> dist/ folder updated."

# 4. Backend Dependencies
log_info "Installing backend dependencies in server/..."
cd "$PROJECT_DIR/server"
npm install --omit=dev

# Verify server .env exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    log_warn "server/.env not found! Copying from .env.example..."
    cp .env.example .env
  else
    log_error "No .env found in server directory!"
  fi
fi

# 5. Restart Backend Process via PM2
log_info "Managing PM2 backend process..."
APP_NAME="saiyogi-backend"

if command -v pm2 >/dev/null 2>&1; then
  # Check if any existing saiyogi/cracker process is running under pm2
  RUNNING_NAME=$(pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*"' | grep -iE 'saiyogi|cracker|server' | head -1 | cut -d'"' -f4 || echo "")
  
  if [ -n "$RUNNING_NAME" ]; then
    log_info "Found existing PM2 process '$RUNNING_NAME'. Reloading..."
    pm2 reload "$RUNNING_NAME" --update-env || pm2 restart "$RUNNING_NAME" --update-env
    APP_NAME="$RUNNING_NAME"
  elif pm2 describe "$APP_NAME" >/dev/null 2>&1; then
    log_info "Restarting PM2 process '$APP_NAME'..."
    pm2 restart "$APP_NAME" --update-env
  else
    log_info "Starting new PM2 process '$APP_NAME'..."
    pm2 start server.js --name "$APP_NAME" --time
  fi
  
  pm2 save || true
  log_success "PM2 process '$APP_NAME' is active."
else
  log_warn "PM2 is not installed globally. Run 'npm install -g pm2' for process management."
  log_info "Attempting npx pm2 restart..."
  npx pm2 restart "$APP_NAME" 2>/dev/null || npx pm2 start server.js --name "$APP_NAME" || true
fi

cd "$PROJECT_DIR"

# 6. Nginx Reload (if installed and active)
if command -v nginx >/dev/null 2>&1; then
  log_info "Testing and reloading Nginx..."
  if sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx 2>/dev/null || sudo service nginx reload 2>/dev/null || true
    log_success "Nginx reloaded successfully."
  else
    log_warn "Nginx configuration test failed or sudo permission missing. Please check manually if needed."
  fi
fi

# 7. Health Check
log_info "Checking backend health status..."
sleep 2
PORT=${PORT:-5005}
if command -v curl >/dev/null 2>&1; then
  HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/health" || curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/health" || echo "000")
  if [ "$HEALTH_STATUS" = "200" ]; then
    log_success "Backend health check passed! (HTTP 200 on port $PORT)"
  else
    log_warn "Backend returned HTTP $HEALTH_STATUS. Check PM2 logs using 'pm2 logs $APP_NAME'."
  fi
fi

echo -e "${GREEN}"
echo "========================================================"
echo "    ✨ Redeployment Completed Successfully!            "
echo "========================================================"
echo -e "${NC}"

