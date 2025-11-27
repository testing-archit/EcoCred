/**
 * Application configuration - No .env files needed!
 * All configuration is automatic or has sensible defaults
 */

export const config = {
  // Server
  PORT: 3001,
  NODE_ENV: 'development',
  
  // CORS
  CORS_ORIGIN: 'http://localhost:5173',
  
  // Blockchain
  BLOCKCHAIN_RPC_URL: 'http://localhost:8545',
  CHAIN_ID: 31337, // Hardhat local network
  
  // JWT
  JWT_SECRET: 'ecocred-jwt-secret-key-change-in-production',
  
  // Logging
  LOG_LEVEL: 'info',
  
  // Database (imported from database config)
  // DATABASE_URL is imported from ./database.ts
};

export default config;

