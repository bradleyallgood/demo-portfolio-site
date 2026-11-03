import pg from 'pg';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Without a listener, an idle connection dropping would crash the process.
pool.on('error', (err) => console.error('Postgres pool error:', err.message));
