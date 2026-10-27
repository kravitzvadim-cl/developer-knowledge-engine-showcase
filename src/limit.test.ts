import { beforeEach, describe, expect, it } from 'vitest'
import { allow, resetLimits } from './limit.ts'

const limits = { perMinute: 2, perDay: 3, globalPerDay: 4 }
const t = Date.UTC(2026, 9, 12, 10, 0, 0)

describe('allow', () => {
  beforeEach(resetLimits)

  it('blocks an IP after its per-minute limit, then allows it next minute', () => {
    expect(allow('a', t, limits)).toBeNull()
    expect(allow('a', t, limits)).toBeNull()
    expect(allow('a', t, limits)).toMatch(/in a minute/)
    expect(allow('a', t + 60_000, limits)).toBeNull()
  })

  it('blocks an IP after its daily limit', () => {
    for (let i = 0; i < 3; i++) expect(allow('a', t + i * 60_000, limits)).toBeNull()
    expect(allow('a', t + 10 * 60_000, limits)).toMatch(/today's limit/)
  })

  it('caps all IPs together per day, and a blocked request is not counted', () => {
    for (const ip of ['a', 'b', 'c', 'd']) expect(allow(ip, t, limits)).toBeNull()
    expect(allow('e', t, limits)).toMatch(/daily question limit/)
    expect(allow('e', t + 86_400_000, limits)).toBeNull()
  })
})
