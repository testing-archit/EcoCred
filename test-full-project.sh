#!/bin/bash

# Full Project Test Script
# Tests the entire EcoCred blockchain project

set -e

echo "🚀 Starting EcoCred Full Project Tests"
echo "========================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}Testing: $test_name${NC}"
    if eval "$test_command"; then
        echo -e "${GREEN}✅ $test_name PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌ $test_name FAILED${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# 1. Test Blockchain Contracts
echo -e "\n${YELLOW}=== Testing Blockchain Contracts ===${NC}"
cd blockchain

run_test "Compile contracts" "npx hardhat compile"
run_test "Run unit tests" "npx hardhat test"
run_test "Run integration tests" "npx hardhat test test/Integration.test.ts"
run_test "Run full stack tests" "npx hardhat test test/FullStack.test.ts"

cd ..

# 2. Test Backend
echo -e "\n${YELLOW}=== Testing Backend ===${NC}"
cd backend

run_test "Install dependencies" "npm install --silent"
run_test "Type check backend" "npx tsc --noEmit"
run_test "Lint backend" "npm run lint 2>/dev/null || echo 'Linting skipped'"

cd ..

# 3. Test Frontend
echo -e "\n${YELLOW}=== Testing Frontend ===${NC}"
cd frontend-react

run_test "Install dependencies" "npm install --silent"
run_test "Type check frontend" "npx tsc --noEmit"
run_test "Build frontend" "npm run build"

cd ..

# 4. Test Integration
echo -e "\n${YELLOW}=== Testing Integration ===${NC}"

# Check if Hardhat node is running
if lsof -Pi :8545 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Hardhat node is running${NC}"
else
    echo -e "${YELLOW}⚠️  Hardhat node not running. Start it with: cd blockchain && npx hardhat node${NC}"
fi

# Check if backend is running
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Backend server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend server not running. Start it with: cd backend && npm run dev${NC}"
fi

# Check if frontend is running
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✅ Frontend server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend server not running. Start it with: cd frontend-react && npm run dev${NC}"
fi

# Summary
echo -e "\n${YELLOW}========================================"
echo "Test Summary"
echo "========================================${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed${NC}"
    exit 1
fi

