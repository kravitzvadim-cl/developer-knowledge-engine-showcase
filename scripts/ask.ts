import { openDb } from '../src/db.ts'
import { answer } from '../src/answer.ts'

const question = process.argv.slice(2).join(' ')
if (!question) {
  console.error('usage: npm run ask -- "how do I ...?"')
  process.exit(1)
}
const db = await openDb()
const a = await answer(db, question)
console.log(`\n${a.answer}\n`)
for (const [i, s] of a.sources.entries())
  console.log(`${a.citations.includes(i + 1) ? '*' : ' '} [${i + 1}] ${s.section}  ${s.url}`)
console.log(
  `\n${a.refused ? 'REFUSED' : `confidence: ${a.confidence}`} · ${a.model} · ${a.latencyMs} ms · $${a.usage.costUsd.toFixed(4)}`,
)
await db.close()
