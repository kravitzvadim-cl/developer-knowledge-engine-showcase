import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

// Invite-only access: ACCESS_CODES="vadim:k3x9...:unlimited,dana:p7q2...,sam:z8w1...:25" — one code per
// person, so one can be revoked (delete it, restart) without touching the others. The optional third
// field is that person's question allowance: a number, or "unlimited"; left out, it is GUEST_QUESTIONS.
// Logs show the name, never the code.
// ponytail: codes live in an env var; move to a table if invites ever need self-service.
export const GUEST_QUESTIONS = 10

export type Guest = { name: string; limit: number }

export function parseCodes(raw = ''): Map<string, Guest> {
  const codes = new Map<string, Guest>()
  for (const entry of raw.split(',')) {
    const [name, code, limit] = entry.split(':').map(s => s?.trim())
    if (!name || !code || code.length < 8) continue
    const n = limit === 'unlimited' ? Infinity : limit ? Number(limit) : GUEST_QUESTIONS
    if (!Number.isNaN(n)) codes.set(code, { name, limit: n })
  }
  return codes
}

// Questions answered per person, kept in a file so a restart doesn't hand out a fresh allowance.
// ponytail: one JSON file rewritten per question; fine for a handful of guests on one machine.
export function usageStore(file: string) {
  let used: Record<string, number> = {}
  try { used = JSON.parse(readFileSync(file, 'utf8')) } catch {}
  return {
    left: (g: Guest) => Math.max(0, g.limit - (used[g.name] ?? 0)),
    count(g: Guest) {
      used[g.name] = (used[g.name] ?? 0) + 1
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, JSON.stringify(used, null, 2))
    },
  }
}

// Wrong codes per IP per day; after 10 the IP is shut out until tomorrow, so codes can't be guessed.
const misses = new Map<string, number>()
export const MAX_MISSES = 10
export function tooManyMisses(ip: string, now = Date.now()) {
  return (misses.get(`${ip}:${Math.floor(now / 86_400_000)}`) ?? 0) >= MAX_MISSES
}
export function recordMiss(ip: string, now = Date.now()) {
  const key = `${ip}:${Math.floor(now / 86_400_000)}`
  misses.set(key, (misses.get(key) ?? 0) + 1)
}
