import { readFileSync, writeFileSync } from 'node:fs'
import { z } from 'zod'
import { openDb } from '../src/db.ts'
import { answer, chat, MODEL, PROMPT_VERSION, type Answer } from '../src/answer.ts'

type Case = {
  id: string
  type: 'answerable' | 'out_of_scope' | 'adversarial'
  question: string
  sources: string[]
  facts: string[]
  refuse?: boolean
}

const JUDGE_MODEL = process.env.JUDGE_MODEL ?? 'anthropic/claude-haiku-5.5'
const Verdict = z.object({
  grounded: z.number().min(0).max(1),
  correct: z.number().min(0).max(1),
  reason: z.string(),
})
const JUDGE = `You grade an answer produced by a documentation assistant.
grounded: the share of the answer's claims (0 to 1) that are directly supported by the source it cites. A claim with a wrong or missing citation is unsupported.
correct: 1 if the answer correctly and fully answers the question given the sources, 0.5 if partly, 0 if wrong.
Give a one-sentence reason.`

const cases: Case[] = JSON.parse(readFileSync('evals/gold.json', 'utf8'))
const only = process.argv[2] // optional: run one case id
const db = await openDb()

async function run(c: Case) {
  const mustRefuse = c.type === 'out_of_scope' || !!c.refuse
  let a: Answer | null = null
  let error: string | null = null
  try {
    a = await answer(db, c.question)
  } catch (e) {
    error = (e as Error).message
  }
  const r = {
    id: c.id,
    type: c.type,
    schemaValid: !!a,
    retrievalHit: c.sources.length ? !!a?.sources.some(s => c.sources.includes(s.source)) : null,
    refusalCorrect: a ? a.refused === mustRefuse : false,
    factsFound: a && !a.refused && c.facts.length
      ? c.facts.every(f => a!.answer.toLowerCase().includes(f.toLowerCase()))
      : null,
    grounded: null as number | null,
    correct: null as number | null,
    topSimilarity: a ? Math.max(...a.sources.map(s => s.similarity)) : null,
    costUsd: a?.usage.costUsd ?? 0,
    latencyMs: a?.latencyMs ?? null,
    answer: a?.answer ?? null,
    error,
    judge: null as string | null,
  }
  if (a && !a.refused) {
    const cited = a.citations.map(n => `[${n}] ${a!.sources[n - 1].text}`).join('\n\n---\n\n')
    const { data, usage } = await chat(
      JUDGE_MODEL,
      JUDGE,
      `Question: ${c.question}\n\nCited sources:\n\n${cited}\n\nAnswer:\n${a.answer}`,
      Verdict,
    )
    r.grounded = data.grounded
    r.correct = data.correct
    r.judge = data.reason
    r.costUsd += usage.costUsd
  }
  const ok = r.schemaValid && r.refusalCorrect && r.factsFound !== false && r.retrievalHit !== false
  console.log(`${ok ? 'PASS' : 'FAIL'} ${c.id} ${c.question}${error ? `  (${error})` : ''}`)
  return r
}

// A few at a time: fast enough, gentle on the rate limit.
const todo = cases.filter(c => !only || c.id === only)
const results: Awaited<ReturnType<typeof run>>[] = []
for (let i = 0; i < todo.length; i += 4) results.push(...(await Promise.all(todo.slice(i, i + 4).map(run))))
await db.close()

const pct = (xs: (boolean | null)[]) => {
  const v = xs.filter(x => x !== null)
  return v.length ? Math.round((100 * v.filter(Boolean).length) / v.length) : null
}
const avg = (xs: (number | null)[]) => {
  const v = xs.filter(x => x !== null) as number[]
  return v.length ? Math.round((100 * v.reduce((s, x) => s + x, 0)) / v.length) : null
}
const lat = results.map(r => r.latencyMs).filter(x => x !== null).sort((a, b) => a - b) as number[]
const scores = {
  cases: results.length,
  schemaValid: pct(results.map(r => r.schemaValid)),
  retrievalHitAt5: pct(results.map(r => r.retrievalHit)),
  groundedness: avg(results.map(r => r.grounded)),
  correctness: avg(results.map(r => r.correct)),
  keyFacts: pct(results.map(r => r.factsFound)),
  correctRefusal: pct(results.filter(r => cases.find(c => c.id === r.id)!.sources.length === 0).map(r => r.refusalCorrect)),
  falseRefusal: pct(results.filter(r => cases.find(c => c.id === r.id)!.sources.length > 0).map(r => !r.refusalCorrect)),
  p95LatencyMs: lat[Math.floor(lat.length * 0.95)] ?? null,
  totalCostUsd: Number(results.reduce((s, r) => s + r.costUsd, 0).toFixed(4)),
}
console.table(scores)
// CI writes to evals/latest.json and compares it with main's committed baseline (scripts/eval-gate.ts).
const out = process.env.EVAL_OUT ?? 'evals/baseline.json'
if (!only) {
  writeFileSync(
    out,
    JSON.stringify({ date: new Date().toISOString().slice(0, 10), model: MODEL, judge: JUDGE_MODEL, promptVersion: PROMPT_VERSION, scores, results }, null, 2) + '\n',
  )
  console.log(`wrote ${out}`)
}
