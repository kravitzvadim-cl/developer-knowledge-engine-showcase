import { mkdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { vector } from '@electric-sql/pglite-pgvector'
import { EMBED_DIM } from './embed.ts'

// ponytail: in-process Postgres + pgvector (PGlite) so dev and CI need no server;
// swap for a real Postgres URL at deploy time (Day 6), same SQL.
export const DATA_DIR = new URL('../.data/index', import.meta.url).pathname

export async function openDb(dataDir = DATA_DIR) {
  mkdirSync(dataDir, { recursive: true })
  const db = await PGlite.create({ dataDir, extensions: { vector } })
  await db.exec(`
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE TABLE IF NOT EXISTS chunks (
      id text PRIMARY KEY,
      source text NOT NULL,
      url text NOT NULL,
      title text NOT NULL,
      section text NOT NULL,
      text text NOT NULL,
      embedding vector(${EMBED_DIM}) NOT NULL,
      tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || section || ' ' || text)) STORED
    );
    CREATE INDEX IF NOT EXISTS chunks_tsv ON chunks USING gin (tsv);
  `)
  return db
}

export const toVector = (v: number[]) => `[${v.join(',')}]`
