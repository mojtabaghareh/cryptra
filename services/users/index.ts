import { Pool } from 'pg';
import { PostgresUserRepository, UserService } from './UserService';

export * from './UserService';

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

/** Builds a ready-to-use UserService backed by the real PostgreSQL connection pool. */
export function createUserService(): UserService {
  const repository = new PostgresUserRepository(getPool());
  return new UserService(repository);
}
