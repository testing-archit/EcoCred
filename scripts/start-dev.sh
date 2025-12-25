#!/bin/bash

# EcoCred Development Environment Launcher
# This script provides instructions for starting all development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_step() {
    echo -e "${GREEN}[$1]${NC} $2"
}

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_header "🌍 EcoCred Development Environment"

echo -e "${CYAN}Project Root:${NC} $PROJECT_ROOT"
echo ""
print_info "To start the full development environment, open separate terminals and run:"
echo ""

# Terminal 1
print_step "Terminal 1" "Blockchain Node (Hardhat)"
echo "  cd $PROJECT_ROOT/blockchain"
echo "  npm run node"
echo ""

# Terminal 2
print_step "Terminal 2" "Backend API Server"
echo "  cd $PROJECT_ROOT/backend"
echo "  npm run dev"
echo ""

# Terminal 3
print_step "Terminal 3" "Frontend Development Server"
echo "  cd $PROJECT_ROOT/frontend-react"
echo "  npm run dev"
echo ""

print_warning "Don't forget to deploy contracts after starting the blockchain node!"
echo ""
print_step "Terminal 4" "Deploy Smart Contracts (one-time)"
echo "  cd $PROJECT_ROOT/blockchain"
echo "  npm run deploy"
echo ""

print_header "🔗 Service URLs"
echo "  Blockchain RPC:  ${CYAN}http://localhost:8545${NC}"
echo "  Backend API:     ${CYAN}http://localhost:3001${NC}"
echo "  Frontend App:    ${CYAN}http://localhost:5173${NC}"
echo ""

print_header "📝 Quick Notes"
echo "  • Blockchain must be running before deploying contracts"
echo "  • Backend requires deployed contracts to function properly"
echo "  • Frontend connects to both backend API and blockchain"
echo "  • Use MetaMask with localhost network (Chain ID: 31337)"
echo ""

print_info "Happy coding! 🚀"
echo ""
