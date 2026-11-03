import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from '../src/db.js';

const migrationsDir = path.join(import.meta.dirname, 'migrations');

await pool.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename   text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

const { rows } = await pool.query('SELECT filename FROM schema_migrations');
const applied = new Set(rows.map((row) => row.filename));
const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

for (const file of files) {
  if (applied.has(file)) continue;

  const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    await client.query('COMMIT');
    console.log(`Applied ${file}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

await pool.end();
