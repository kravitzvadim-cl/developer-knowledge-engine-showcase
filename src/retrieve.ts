import type { PGlite } from '@electric-sql/pglite'
import type { Chunk } from './chunk.ts'
import { embed } from './embed.ts'
import { toVector } from './db.ts'
import { rerankScores } from './rerank.ts'

export type Hit = Chunk & { score: number; similarity: number }

const POOL = 20
const RERANK_POOL = 15
const RRF_K = 60

// Hybrid search: vector + keyword merged with reciprocal rank fusion, then a cross-encoder rerank.
export async function retrieve(db: PGlite, question: string, k = 5): Promise<Hit[]> {
  const [q] = await embed([question], { query: true })
  const cols = 'id, source, url, title, section, text'
  const vec = await db.query<Chunk & { similarity: number }>(
    `SELECT ${cols}, 1 - (embedding <=> $1) AS similarity FROM chunks ORDER BY embedding <=> $1 LIMIT ${POOL}`,
    [toVector(q)],
  )
  // OR the query terms: a natural-language question rarely has every word in one chunk.
  const kw = await db.query<Chunk & { similarity: number }>(
    `SELECT ${cols}, 1 - (embedding <=> $2) AS similarity FROM chunks,
       to_tsquery('english', replace(plainto_tsquery('english', $1)::text, '&', '|')) q
     WHERE tsv @@ q ORDER BY ts_rank_cd(tsv, q) DESC LIMIT ${POOL}`,
    [question, toVector(q)],
  )

  const hits = new Map<string, Hit>()
  const add = (rows: (Chunk & { similarity: number })[]) =>
    rows.forEach((r, rank) => {
      const h = hits.get(r.id) ?? { ...r, score: 0 }
      h.score += 1 / (RRF_K + rank + 1)
      hits.set(r.id, h)
    })
  add(vec.rows)
  add(kw.rows)
  const pool = [...hits.values()].sort((a, b) => b.score - a.score).slice(0, RERANK_POOL)
  // Rerank the fused pool with a cross-encoder; heading path is part of what it reads.
  const rs = await rerankScores(question, pool.map(h => `${h.section}\n${h.text}`))
  pool.forEach((h, i) => (h.score = rs[i]))
  return pool.sort((a, b) => b.score - a.score).slice(0, k)
}
