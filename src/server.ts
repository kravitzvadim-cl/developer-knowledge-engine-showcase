import { createServer, type IncomingMessage } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { z } from 'zod'
import { openDb } from './db.ts'
import { answer, type Answer } from './answer.ts'
import { allow } from './limit.ts'
import { parseCodes, recordMiss, tooManyMisses, usageStore } from './access.ts'

const PORT = Number(process.env.PORT ?? 8787)
// The UI's origin when it is served from another domain (e.g. Vercel), comma-separated.
const ALLOWED = (process.env.ALLOWED_ORIGIN ?? '').split(',').map(s => s.trim()).filter(Boolean)
const Body = z.object({ question: z.string().trim().min(3).max(500) })

const CODES = parseCodes(process.env.ACCESS_CODES)
if (!CODES.size) console.warn('ACCESS_CODES is empty: every question will be refused with 401.')
const usage = usageStore(new URL('../.data/usage.json', import.meta.url).pathname)
// JSON has no Infinity: null means unlimited.
const leftFor = (g: { limit: number; name: string }) => (g.limit === Infinity ? null : usage.left(g))

const db = await openDb()

// The built UI (npm run build) is served from here too, so one address covers site and API.
const DIST = join(import.meta.dirname, '../dist')
const TYPES: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.png': 'image/png' }
async function serveUi(url: string) {
  let path
  try { path = normalize(join(DIST, decodeURIComponent(url.split('?')[0]))) } catch { return null }
  if (!path.startsWith(DIST + '/') && path !== DIST) return null
  for (const file of [path, join(DIST, 'index.html')])
    try { return { body: await readFile(file), type: TYPES[extname(file)] ?? 'application/octet-stream' } } catch {}
  return null
}

// ponytail: first x-forwarded-for hop is client-supplied and spoofable; the global daily cap
// in limit.ts is what actually protects the credit.
// Behind the Cloudflare tunnel, cf-connecting-ip is the visitor's real address.
const clientIp = (req: IncomingMessage) =>
  String(req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown'

// One JSON line per question: what was asked, what was retrieved, and what it cost.
function log(who: string, question: string, status: number, a?: Answer, error?: string) {
  console.log(JSON.stringify({
    t: new Date().toISOString(),
    who,
    status,
    question,
    chunks: a?.sources.map(s => s.id),
    model: a?.model,
    promptVersion: a?.promptVersion,
    refused: a?.refused,
    latencyMs: a?.latencyMs,
    promptTokens: a?.usage.promptTokens,
    completionTokens: a?.usage.completionTokens,
    costUsd: a?.usage.costUsd,
    error,
  }))
}

const server = createServer(async (req, res) => {
  const origin = req.headers.origin
  const cors: Record<string, string> =
    origin && ALLOWED.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}
  const send = (status: number, body: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json', ...cors })
    res.end(JSON.stringify(body))
  }
  if (req.method === 'OPTIONS') {
    res.writeHead(204, { ...cors, 'access-control-allow-methods': 'POST, GET', 'access-control-allow-headers': 'content-type, x-access-code', 'access-control-max-age': '86400' })
    return res.end()
  }
  if (req.method === 'GET' && req.url === '/api/health') return send(200, { ok: true })
  if (req.method === 'GET' && !req.url?.startsWith('/api/')) {
    const file = await serveUi(req.url ?? '/')
    if (!file) return send(404, { error: 'not found' })
    res.writeHead(200, { 'content-type': file.type })
    return res.end(file.body)
  }

  // Everything else needs an invite code; too many wrong ones shut that address out for the day.
  const ip = clientIp(req)
  if (tooManyMisses(ip)) return send(429, { error: 'Too many wrong access codes. Try again tomorrow.' })
  const code = String(req.headers['x-access-code'] ?? '')
  const guest = CODES.get(code)
  if (!guest) {
    if (code) recordMiss(ip)
    return send(401, { error: 'This demo is invite-only. Enter a valid access code.' })
  }
  const who = guest.name
  if (req.method === 'GET' && req.url === '/api/unlock') return send(200, { ok: true, who, left: leftFor(guest) })
  if (req.method !== 'POST' || req.url !== '/api/ask') return send(404, { error: 'not found' })

  let raw = ''
  for await (const chunk of req) {
    raw += chunk
    if (raw.length > 10_000) return send(413, { error: 'request too large' })
  }
  let parsed
  try {
    parsed = Body.safeParse(JSON.parse(raw))
  } catch {
    return send(400, { error: 'invalid JSON' })
  }
  if (!parsed.success) return send(400, { error: 'question must be 3 to 500 characters' })
  const { question } = parsed.data

  if (usage.left(guest) <= 0) {
    log(who, question, 403, undefined, 'allowance used up')
    return send(403, { error: `You've used all ${guest.limit} questions in your invite. Thanks for trying it! Ask Vadim if you'd like more.` })
  }

  const limited = allow(ip)
  if (limited) {
    log(who, question, 429, undefined, 'rate limited')
    return send(429, { error: limited })
  }

  try {
    const a = await answer(db, question)
    usage.count(guest)
    log(who, question, 200, a)
    send(200, { ...a, left: leftFor(guest) })
  } catch (e) {
    log(who, question, 502, undefined, (e as Error).message)
    send(502, { error: 'Could not produce a valid cited answer. Please try again.' })
  }
})

// One bad request must never take the whole demo down.
process.on('unhandledRejection', e => console.error('unhandled', e))
server.listen(PORT, '127.0.0.1', () => console.log(`API on http://localhost:${PORT}`))
