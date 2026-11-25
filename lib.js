import { neon } from '@neondatabase/serverless';

// Edit these 8 names to change the categories everywhere (page, results, Excel).
export const CATEGORIES = [
  'Financial freedom',
  'Travel the world',
  'Dream career',
  'Master a passion',
  'Peace of mind',
  'Confidence',
  'Work-life balance',
  'Loved ones',
];

// Creates the table automatically on first use.
export async function getSql() {
  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    points JSONB NOT NULL,
    submitted_at TIMESTAMPTZ DEFAULT now()
  )`;
  return sql;
}
