/**
 * Database configuration - No .env files needed!
 * Automatically uses the Neon PostgreSQL database connection
 */

export const DATABASE_URL = "postgresql://neondb_owner:npg_ezJ1TOQbl7NB@ep-solitary-field-a1tnzlw1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Export for use in Prisma schema and other places
export default {
  DATABASE_URL,
};

