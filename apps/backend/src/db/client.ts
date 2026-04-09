import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

/**
 * Execute a query WITHOUT tenant scoping (for public routes & admin)
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

/**
 * Execute a query WITH tenant scoping via RLS.
 * Sets `app.current_tenant_id` session variable so RLS policies fire.
 * Uses a transaction to scope the SET LOCAL to this query only.
 */
export async function tenantQuery<T = any>(
  tenantId: string,
  text: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    const result = await client.query(text, params);
    await client.query('COMMIT');
    return result.rows as T[];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Execute multiple queries within the same tenant-scoped transaction.
 */
export async function tenantTransaction<T = any>(
  tenantId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export { pool };
