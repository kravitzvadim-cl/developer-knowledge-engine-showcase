// Fixed-window counters: per IP per minute, per IP per day, and one global daily cap that
// protects the OpenRouter credit.
// ponytail: in-memory, so limits reset on restart and only hold for a single instance;
// move the counters to Postgres or Redis if the API ever runs on more than one.
export const LIMITS = { perMinute: 10, perDay: 100, globalPerDay: 2000 }

const counts = new Map<string, number>()

export function allow(ip: string, now = Date.now(), limits = LIMITS): string | null {
  const minute = Math.floor(now / 60_000)
  const day = Math.floor(now / 86_400_000)
  const keys: [string, number, string][] = [
    [`g:${day}`, limits.globalPerDay, 'The demo has reached its daily question limit. Please come back tomorrow.'],
    [`d:${ip}:${day}`, limits.perDay, "You've reached today's limit for this demo. Please come back tomorrow."],
    [`m:${ip}:${minute}`, limits.perMinute, 'Too many questions in a minute. Please wait a moment and try again.'],
  ]
  for (const [key, max, message] of keys) if ((counts.get(key) ?? 0) >= max) return message
  for (const [key] of keys) counts.set(key, (counts.get(key) ?? 0) + 1)
  // Drop counters from earlier windows so the map stays small.
  if (counts.size > 10_000)
    for (const k of counts.keys())
      if (!k.endsWith(`:${day}`) && !k.endsWith(`:${minute}`)) counts.delete(k)
  return null
}

export const resetLimits = () => counts.clear()
