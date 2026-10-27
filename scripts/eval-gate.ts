import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

// Merge gate: every metric meets its threshold and none drops more than MAX_DROP points from main.
// Thresholds were set from the Day 3 baseline (see README).
type Rule = { label: string; min?: number; max?: number; higherIsBetter: boolean; gate: boolean; unit?: string }
const RULES: Record<string, Rule> = {
  schemaValid: { label: 'Schema-valid answers', min: 97, higherIsBetter: true, gate: true },
  groundedness: { label: 'Groundedness', min: 90, higherIsBetter: true, gate: true },
  correctness: { label: 'Correctness (judge)', min: 85, higherIsBetter: true, gate: true },
  keyFacts: { label: 'Key facts present', min: 85, higherIsBetter: true, gate: true },
  retrievalHitAt5: { label: 'Retrieval hit @5', min: 85, higherIsBetter: true, gate: true },
  correctRefusal: { label: 'Correct refusal', min: 90, higherIsBetter: true, gate: true },
  falseRefusal: { label: 'False refusal', max: 10, higherIsBetter: false, gate: true },
  // ponytail: latency and cost are reported, not gated; CI network latency is too noisy to block on.
  p95LatencyMs: { label: 'p95 latency', higherIsBetter: false, gate: false, unit: ' ms' },
  totalCostUsd: { label: 'Cost of this run', higherIsBetter: false, gate: false, unit: ' USD' },
}
const MAX_DROP = 3

const read = (path: string) => JSON.parse(readFileSync(path, 'utf8')).scores as Record<string, number | null>
const latest = read(process.argv[2] ?? 'evals/latest.json')
let main: Record<string, number | null>
let mainLabel = 'main'
try {
  main = JSON.parse(execSync('git show origin/main:evals/baseline.json', { encoding: 'utf8' })).scores
} catch {
  main = read('evals/baseline.json')
  mainLabel = 'local baseline'
}

let failed = false
const rows = Object.entries(RULES).map(([key, r]) => {
  const now = latest[key]
  const was = main[key]
  const problems: string[] = []
  if (r.gate && now === null) problems.push('missing')
  if (r.gate && now !== null) {
    if (r.min !== undefined && now < r.min) problems.push(`below ${r.min}`)
    if (r.max !== undefined && now > r.max) problems.push(`above ${r.max}`)
    if (was !== null && was !== undefined) {
      const drop = r.higherIsBetter ? was - now : now - was
      if (drop > MAX_DROP) problems.push(`${drop} pts worse than ${mainLabel}`)
    }
  }
  if (problems.length) failed = true
  const fmt = (v: number | null | undefined) => (v === null || v === undefined ? '–' : `${v}${r.unit ?? '%'}`)
  const target = r.min !== undefined ? `≥ ${r.min}%` : r.max !== undefined ? `≤ ${r.max}%` : 'report'
  const status = !r.gate ? 'ℹ️' : problems.length ? `❌ ${problems.join(', ')}` : '✅'
  return `| ${r.label} | ${fmt(now)} | ${fmt(was)} | ${target} | ${status} |`
})

const report = [
  `## Eval gate: ${failed ? '❌ failed' : '✅ passed'}`,
  '',
  `${latest.cases} gold questions. A metric fails if it misses its target or drops more than ${MAX_DROP} points from ${mainLabel}.`,
  '',
  `| Metric | This PR | ${mainLabel} | Target | Status |`,
  '| --- | --- | --- | --- | --- |',
  ...rows,
  '',
].join('\n')
writeFileSync('evals/report.md', report)
console.log(report)
process.exit(failed ? 1 : 0)
