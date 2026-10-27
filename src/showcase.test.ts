import { afterEach, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { chat } from './answer.ts'

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals() })

test.each([undefined, 'false'])('an inherited key cannot trigger a paid request when opt-in is %s', async flag => {
  vi.stubEnv('SHOWCASE_ENABLE_LIVE', flag)
  vi.stubEnv('OPENROUTER_API_KEY', 'not-a-real-credential')
  const network = vi.fn(() => { throw new Error('Unexpected network call') })
  vi.stubGlobal('fetch', network)
  await expect(chat('test-model', 'system', 'question', z.object({}))).rejects.toThrow('disabled in this showcase')
  expect(network).not.toHaveBeenCalled()
})
