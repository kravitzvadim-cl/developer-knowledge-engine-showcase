import { openDb } from '../src/db.ts'
import { retrieve } from '../src/retrieve.ts'

const question = process.argv.slice(2).join(' ')
if (!question) {
  console.error('usage: npm run query -- "how do I ...?"')
  process.exit(1)
}
const db = await openDb()
for (const [i, h] of (await retrieve(db, question)).entries()) {
  console.log(`${i + 1}. [${h.score.toFixed(4)} | sim ${h.similarity.toFixed(3)}] ${h.section}`)
  console.log(`   ${h.url}`)
}
await db.close()
