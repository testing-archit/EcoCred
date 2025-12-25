#!/bin/bash

# EcoCred Comprehensive Test Runner
# Runs all tests across blockchain, backend, and frontend

set +e  # Don't exit on error, we want to run all tests

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

print_header() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_test_result() {
    local test_name=$1
    local result=$2
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ $result -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $test_name ${GREEN}PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗${NC} $test_name ${RED}FAILED${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

print_summary() {
    print_header "📊 Test Summary"
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed! 🎉${NC}"
        return 0
    else
        echo -e "${RED}✗ Some tests failed. Please review the output above.${NC}"
        return 1
    fi
}

# Get project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_header "🧪 EcoCred Comprehensive Test Suite"
echo "Project: $PROJECT_ROOT"
echo ""

# Test 1: Blockchain Contract Tests
print_header "1️⃣  Blockchain Contract Tests"
cd "$PROJECT_ROOT/blockchain"
if [ -f "package.json" ]; then
    echo "Running: npm test"
    npm test
    print_test_result "Blockchain Contract Tests" $?
else
    echo -e "${YELLOW}⚠${NC} No package.json found in blockchain/"
    print_test_result "Blockchain Contract Tests" 1
fi

# Test 2: Blockchain Compilation
print_header "2️⃣  Blockchain Contract Compilation"
cd "$PROJECT_ROOT/blockchain"
if [ -f "hardhat.config.ts" ]; then
    echo "Running: npx hardhat compile"
    npx hardhat compile --quiet
    print_test_result "Contract Compilation" $?
else
    echo -e "${YELLOW}⚠${NC} No hardhat.config.ts found"
    print_test_result "Contract Compilation" 1
fi

# Test 3: Backend Build
print_header "3️⃣  Backend TypeScript Build"
cd "$PROJECT_ROOT/backend"
if [ -f "package.json" ]; then
    echo "Running: npm run build"
    npm run build
    print_test_result "Backend Build" $?
else
    echo -e "${YELLOW}⚠${NC} No package.json found in backend/"
    print_test_result "Backend Build" 1
fi

# Test 4: Backend Type Check
print_header "4️⃣  Backend Type Check"
cd "$PROJECT_ROOT/backend"
if [ -f "tsconfig.json" ]; then
    echo "Running: tsc --noEmit"
    npx tsc --noEmit
    print_test_result "Backend Type Check" $?
else
    echo -e "${YELLOW}⚠${NC} No tsconfig.json found in backend/"
    print_test_result "Backend Type Check" 1
fi

# Test 5: Frontend Build
print_header "5️⃣  Frontend Production Build"
cd "$PROJECT_ROOT/frontend-react"
if [ -f "package.json" ]; then
    echo "Running: npm run build"
    npm run build
    print_test_result "Frontend Build" $?
else
    echo -e "${YELLOW}⚠${NC} No package.json found in frontend-react/"
    print_test_result "Frontend Build" 1
fi

# Test 6: Frontend Lint
print_header "6️⃣  Frontend Code Linting"
cd "$PROJECT_ROOT/frontend-react"
if [ -f "package.json" ]; then
    echo "Running: npm run lint"
    npm run lint
    print_test_result "Frontend Lint" $?
else
    echo -e "${YELLOW}⚠${NC} No package.json found in frontend-react/"
    print_test_result "Frontend Lint" 1
fi

# Summary
print_summary
exit $?
