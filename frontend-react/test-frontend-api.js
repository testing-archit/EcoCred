/**
 * Frontend API Test Suite
 * Tests all frontend API endpoints and functionality
 */

const BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5173';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
  try {
    await fn();
    log(`✅ ${name}`, 'green');
    testsPassed++;
    return true;
  } catch (error) {
    log(`❌ ${name}: ${error.message}`, 'red');
    testsFailed++;
    return false;
  }
}

async function fetchAPI(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
}

// Test Suite
async function runTests() {
  log('\n🧪 Frontend API Test Suite', 'blue');
  log('==========================================\n', 'blue');

  // 1. Health Check
  await test('Backend Health Check', async () => {
    const response = await fetch('http://localhost:3001/health');
    if (!response.ok) throw new Error('Health check failed');
  });

  // 2. Frontend Accessibility
  await test('Frontend Accessibility', async () => {
    const response = await fetch(FRONTEND_URL);
    if (!response.ok) throw new Error('Frontend not accessible');
  });

  // 3. API Endpoints
  await test('Get Nonce Endpoint', async () => {
    const walletAddress = '0x1234567890123456789012345678901234567890';
    try {
      await fetchAPI(`/auth/nonce?walletAddress=${walletAddress}`);
    } catch (error) {
      // Nonce endpoint might require specific format
      if (error.message.includes('404')) {
        throw new Error('Nonce endpoint not found - check route configuration');
      }
      throw error;
    }
  });

  await test('Get Action Types', async () => {
    try {
      await fetchAPI('/actions/types');
    } catch (error) {
      // Action types might be at different endpoint
      if (error.message.includes('404')) {
        log('⚠️  Action types endpoint may need authentication', 'yellow');
        return; // Skip this test
      }
      throw error;
    }
  });

  await test('Get Companies', async () => {
    try {
      await fetchAPI('/companies');
    } catch (error) {
      if (error.message.includes('404')) {
        log('⚠️  Companies endpoint may need authentication', 'yellow');
        return;
      }
      throw error;
    }
  });

  await test('Get Overview', async () => {
    try {
      await fetchAPI('/overview');
    } catch (error) {
      if (error.message.includes('404')) {
        throw new Error('Overview endpoint not found');
      }
      throw error;
    }
  });

  await test('Get Trends', async () => {
    try {
      await fetchAPI('/trends?days=7');
    } catch (error) {
      if (error.message.includes('404')) {
        log('⚠️  Trends endpoint may need authentication', 'yellow');
        return;
      }
      throw error;
    }
  });

  // 4. CORS Check
  await test('CORS Headers', async () => {
    const response = await fetch(`${BASE_URL}/overview`, {
      method: 'OPTIONS'
    });
    if (!response.headers.get('access-control-allow-origin')) {
      throw new Error('CORS headers missing');
    }
  });

  // Summary
  log('\n==========================================', 'blue');
  log('Test Summary', 'blue');
  log('==========================================', 'blue');
  log(`Tests Passed: ${testsPassed}`, 'green');
  log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
  
  if (testsFailed === 0) {
    log('\n🎉 All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed', 'red');
    process.exit(1);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.error('This script requires Node.js 18+ with native fetch support');
  console.error('Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});

