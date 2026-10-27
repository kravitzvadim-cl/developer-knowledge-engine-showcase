import { readFileSync } from 'node:fs'
import { openDb } from '../src/db.ts'
import { retrieve } from '../src/retrieve.ts'

// Deterministic retrieval check: is a gold source in the top 5? No LLM call.
type Case = { question: string; sources: string[] }
const cases: Case[] = JSON.parse(readFileSync(new URL('../evals/retrieval.json', import.meta.url), 'utf8'))

const db = await openDb()
let hits = 0
for (const c of cases) {
  const top = await retrieve(db, c.question)
  const ok = top.some(h => c.sources.includes(h.source))
  hits += +ok
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.question}${ok ? '' : `\n      got: ${top.map(h => h.source).join(', ')}`}`)
}
await db.close()
const rate = hits / cases.length
console.log(`\nhit rate @5: ${(rate * 100).toFixed(0)}% (${hits}/${cases.length})`)
process.exit(rate >= 0.85 ? 0 : 1)
