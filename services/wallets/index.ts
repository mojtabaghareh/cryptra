import { Pool } from 'pg';
import { PostgresWalletRepository, WalletService } from './WalletService';

export * from './WalletService';

let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL in the environment.');
  }
  pool = new Pool({ connectionString });
  return pool;
}

/** Builds a ready-to-use WalletService backed by the real PostgreSQL connection pool. */
export function createWalletService(): WalletService {
  const repository = new PostgresWalletRepository(getPool());
  return new WalletService(repository);
}
