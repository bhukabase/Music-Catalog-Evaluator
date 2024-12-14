/**
 * Database Configuration and Connection
 * Sets up and manages database connections using Drizzle ORM
 * @module db/index
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as schema from './schema';

/**
 * Database configuration interface
 */
interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

/**
 * Load database configuration from environment variables
 * @returns {DBConfig} Database configuration object
 */
function loadDBConfig(): DBConfig {
  const config: DBConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'music_valuation',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  };

  // Enable SSL in production
  if (process.env.NODE_ENV === 'production') {
    config.ssl = true;
  }

  return config;
}

/**
 * Create and configure database pool
 */
const pool = new Pool(loadDBConfig());

/**
 * Handle pool errors
 */
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  // Attempt to reconnect on error
  pool.connect().catch(console.error);
});

/**
 * Initialize database connection with Drizzle ORM
 */
export const db = drizzle(pool, { schema });

/**
 * Verify database connection
 * @returns {Promise<void>}
 * @throws {Error} If database connection fails
 */
export async function verifyConnection(): Promise<void> {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    throw new Error(`Database connection failed: ${error}`);
  }
}
