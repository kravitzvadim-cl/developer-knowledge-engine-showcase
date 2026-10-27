import { describe, expect, it } from 'vitest'
import { ModelOutput, validate } from './answer.ts'

const out = (o: Partial<ModelOutput>): ModelOutput => ({
  answer: 'Use cors() [1].',
  citations: [1],
  confidence: 'high',
  refused: false,
  ...o,
})

describe('validate', () => {
  it('accepts citations inside the retrieved range', () => {
    expect(validate(out({}), 5)).toBeNull()
  })
  it('rejects a citation list entry that was not retrieved', () => {
    expect(validate(out({ citations: [1, 6] }), 5)).toMatch(/not retrieved: 6/)
  })
  it('rejects an inline [n] that was not retrieved', () => {
    expect(validate(out({ answer: 'Yes [9].' }), 5)).toMatch(/not retrieved: 9/)
  })
  it('rejects an uncited answer', () => {
    expect(validate(out({ citations: [], answer: 'Yes.' }), 5)).toMatch(/no citations/)
  })
  it('allows a refusal with no citations', () => {
    expect(validate(out({ citations: [], answer: 'Not covered in the docs.', refused: true }), 5)).toBeNull()
  })
})

describe('ModelOutput', () => {
  it('rejects a missing field', () => {
    expect(ModelOutput.safeParse({ answer: 'x', citations: [] }).success).toBe(false)
  })
})
