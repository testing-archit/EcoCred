#!/bin/bash

# EcoCred Project Setup Script
# This script automates the installation of all dependencies

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    print_success "Node.js $(node --version) detected"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    print_success "npm $(npm --version) detected"
}

# Main setup function
main() {
    print_header "🌍 EcoCred Project Setup"
    
    print_info "Checking system requirements..."
    check_node
    check_npm
    
    # Get project root directory
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
    cd "$PROJECT_ROOT"
    
    print_success "Project root: $PROJECT_ROOT"
    
    # Install blockchain dependencies
    print_header "📦 Installing Blockchain Dependencies"
    cd blockchain
    if [ -f "package.json" ]; then
        print_info "Running npm install in blockchain/"
        npm install
        print_success "Blockchain dependencies installed"
    else
        print_warning "No package.json found in blockchain/"
    fi
    
    # Install backend dependencies
    print_header "📦 Installing Backend Dependencies"
    cd "$PROJECT_ROOT/backend"
    if [ -f "package.json" ]; then
        print_info "Running npm install in backend/"
        npm install
        print_success "Backend dependencies installed"
        
        print_info "Generating Prisma client..."
        npm run db:generate
        print_success "Prisma client generated"
    else
        print_warning "No package.json found in backend/"
    fi
    
    # Install frontend dependencies
    print_header "📦 Installing Frontend Dependencies"
    cd "$PROJECT_ROOT/frontend-react"
    if [ -f "package.json" ]; then
        print_info "Running npm install in frontend-react/"
        npm install
        print_success "Frontend dependencies installed"
    else
        print_warning "No package.json found in frontend-react/"
    fi
    
    # Setup environment files
    print_header "⚙️  Environment Configuration"
    cd "$PROJECT_ROOT"
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_info "Creating .env from .env.example"
            cp .env.example .env
            print_warning "Please update .env with your actual configuration"
        else
            print_warning "No .env.example found. Please create environment files manually."
        fi
    else
        print_success ".env already exists"
    fi
    
    # Summary
    print_header "✨ Setup Complete!"
    echo ""
    print_success "All dependencies installed successfully"
    echo ""
    print_info "Next steps:"
    echo "  1. Review and update environment variables in .env files"
    echo "  2. Start local blockchain: cd blockchain && npm run node"
    echo "  3. Deploy contracts: cd blockchain && npm run deploy"
    echo "  4. Start backend: cd backend && npm run dev"
    echo "  5. Start frontend: cd frontend-react && npm run dev"
    echo ""
    print_info "Or use the automated script:"
    echo "  bash scripts/start-dev.sh"
    echo ""
}

# Run main function
main "$@"
