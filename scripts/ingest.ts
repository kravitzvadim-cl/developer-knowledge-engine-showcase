import { rmSync } from 'node:fs'
import { loadCorpus } from '../src/corpus.ts'
import { DATA_DIR, openDb, toVector } from '../src/db.ts'
import { embed } from '../src/embed.ts'
import { rerankScores } from '../src/rerank.ts'

const t0 = performance.now()
const chunks = loadCorpus()
console.log(`${chunks.length} chunks from ${new Set(chunks.map(c => c.source)).size} files`)

// Embed title + section with the text so a chunk carries its context.
const vectors = await embed(chunks.map(c => `${c.title}\n${c.section}\n\n${c.text}`))

rmSync(DATA_DIR, { recursive: true, force: true })
const db = await openDb()
await db.transaction(async tx => {
  for (const [i, c] of chunks.entries()) {
    await tx.query(
      'INSERT INTO chunks (id, source, url, title, section, text, embedding) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [c.id, c.source, c.url, c.title, c.section, c.text, toVector(vectors[i])],
    )
  }
})
await db.close()
// Fetch the rerank model now too, so a deploy build has everything and start-up downloads nothing.
await rerankScores('warm up', ['ok'])
console.log(`indexed in ${((performance.now() - t0) / 1000).toFixed(1)}s -> ${DATA_DIR}`)
