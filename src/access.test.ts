import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GUEST_QUESTIONS, MAX_MISSES, parseCodes, recordMiss, tooManyMisses, usageStore } from './access.ts'

describe('parseCodes', () => {
  it('maps each code to its owner and allowance, dropping bad entries', () => {
    const codes = parseCodes(' vadim:abcd1234efgh:unlimited , acme:zzzz9999 ,sam:yyyy8888:25,short:abc,:nonamecode1,junk,bad:xxxx7777:lots')
    expect(codes.get('abcd1234efgh')).toEqual({ name: 'vadim', limit: Infinity })
    expect(codes.get('zzzz9999')).toEqual({ name: 'acme', limit: GUEST_QUESTIONS })
    expect(codes.get('yyyy8888')).toEqual({ name: 'sam', limit: 25 })
    expect(codes.size).toBe(3)
  })

  it('locks everything when nothing is configured', () => {
    expect(parseCodes(undefined).size).toBe(0)
  })
})

describe('usageStore', () => {
  it('counts down a guest allowance and remembers it after a restart', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'usage-')), 'usage.json')
    const guest = { name: 'acme', limit: 2 }
    const a = usageStore(file)
    a.count(guest)
    expect(a.left(guest)).toBe(1)
    a.count(guest)
    expect(a.left(guest)).toBe(0)
    expect(usageStore(file).left(guest)).toBe(0)
    expect(usageStore(file).left({ name: 'vadim', limit: Infinity })).toBe(Infinity)
  })
})

describe('wrong-code lockout', () => {
  it('shuts an IP out after too many wrong codes, until the next day', () => {
    const t = Date.UTC(2026, 9, 14, 10)
    for (let i = 0; i < MAX_MISSES; i++) recordMiss('1.2.3.4', t)
    expect(tooManyMisses('1.2.3.4', t)).toBe(true)
    expect(tooManyMisses('5.6.7.8', t)).toBe(false)
    expect(tooManyMisses('1.2.3.4', t + 86_400_000)).toBe(false)
  })
})
