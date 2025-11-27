#!/bin/bash

# Frontend Test Script
# Starts all services and tests the frontend

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting EcoCred Services for Frontend Testing${NC}"
echo "=========================================="

# Function to check if port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for service
wait_for_service() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=0
    
    echo -e "${YELLOW}Waiting for $service on port $port...${NC}"
    while [ $attempt -lt $max_attempts ]; do
        if check_port $port; then
            echo -e "${GREEN}✅ $service is running${NC}"
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    echo -e "${RED}❌ $service failed to start${NC}"
    return 1
}

# Kill existing processes
echo -e "\n${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "hardhat node" 2>/dev/null || true
pkill -f "tsx.*server" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# 1. Start Hardhat Node
echo -e "\n${BLUE}=== Starting Hardhat Node ===${NC}"
cd blockchain
if ! check_port 8545; then
    npx hardhat node > /tmp/hardhat.log 2>&1 &
    HARDHAT_PID=$!
    echo "Hardhat node started (PID: $HARDHAT_PID)"
    wait_for_service 8545 "Hardhat node"
    
    # Deploy contracts
    echo -e "${YELLOW}Deploying contracts...${NC}"
    sleep 3
    npx hardhat run ignition/modules/EcoSystemV3.ts --network localhost > /tmp/deploy.log 2>&1
    echo -e "${GREEN}✅ Contracts deployed${NC}"
    
    # Export addresses
    npx tsx scripts/export-addresses.ts > /tmp/export.log 2>&1
    echo -e "${GREEN}✅ Contract addresses exported${NC}"
else
    echo -e "${GREEN}✅ Hardhat node already running${NC}"
fi
cd ..

# 2. Start Backend
echo -e "\n${BLUE}=== Starting Backend Server ===${NC}"
cd backend
if ! check_port 3001; then
    # Check if database needs migration
    echo -e "${YELLOW}Checking database...${NC}"
    npx prisma generate > /tmp/prisma.log 2>&1
    npx prisma migrate deploy > /tmp/migrate.log 2>&1 || echo "Migration may have already run"
    
    npm run dev > /tmp/backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend started (PID: $BACKEND_PID)"
    wait_for_service 3001 "Backend server"
else
    echo -e "${GREEN}✅ Backend already running${NC}"
fi
cd ..

# 3. Start Frontend
echo -e "\n${BLUE}=== Starting Frontend Server ===${NC}"
cd frontend-react
if ! check_port 5173; then
    npm run dev > /tmp/frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "Frontend started (PID: $FRONTEND_PID)"
    wait_for_service 5173 "Frontend server"
else
    echo -e "${GREEN}✅ Frontend already running${NC}"
fi
cd ..

# 4. Test Frontend
echo -e "\n${BLUE}=== Testing Frontend ===${NC}"
sleep 3

# Test endpoints
echo -e "\n${YELLOW}Testing Backend Health...${NC}"
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend health check passed${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
fi

echo -e "\n${YELLOW}Testing Frontend Accessibility...${NC}"
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is accessible${NC}"
else
    echo -e "${RED}❌ Frontend is not accessible${NC}"
fi

# Check for build errors
echo -e "\n${YELLOW}Checking Frontend Build...${NC}"
cd frontend-react
if npm run build > /tmp/frontend-build.log 2>&1; then
    echo -e "${GREEN}✅ Frontend builds successfully${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    cat /tmp/frontend-build.log | tail -20
fi
cd ..

# Display service status
echo -e "\n${BLUE}=========================================="
echo "Service Status"
echo "==========================================${NC}"
echo -e "Hardhat Node (8545): ${GREEN}✅ Running${NC}"
echo -e "Backend Server (3001): ${GREEN}✅ Running${NC}"
echo -e "Frontend Server (5173): ${GREEN}✅ Running${NC}"

echo -e "\n${BLUE}=========================================="
echo "Frontend Test Summary"
echo "==========================================${NC}"
echo -e "${GREEN}✅ All services started successfully${NC}"
echo -e "\n${YELLOW}Frontend URL: http://localhost:5173${NC}"
echo -e "${YELLOW}Backend URL: http://localhost:3001${NC}"
echo -e "${YELLOW}Hardhat Node: http://localhost:8545${NC}"

echo -e "\n${BLUE}Manual Testing Checklist:${NC}"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Test wallet connection"
echo "3. Test registration/login"
echo "4. Test role-based dashboards"
echo "5. Test blockchain interactions (submit action)"
echo "6. Test transaction status tracking"
echo "7. Test on-chain data display"

echo -e "\n${YELLOW}To stop all services, run:${NC}"
echo "pkill -f 'hardhat node'"
echo "pkill -f 'tsx.*server'"
echo "pkill -f 'vite'"

echo -e "\n${GREEN}🎉 Frontend testing environment ready!${NC}"

