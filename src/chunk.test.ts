import { describe, expect, it } from 'vitest'
import { chunkMarkdown } from './chunk.ts'

const opts = { source: 'api/routing', url: 'https://hono.dev/docs/api/routing' }

describe('chunkMarkdown', () => {
  it('splits by heading and keeps the heading path', () => {
    const md = '---\ntitle: x\n---\n# Routing\n\nIntro.\n\n## Basic\n\nGET and POST.\n\n### Wildcard\n\nStars.\n'
    const cs = chunkMarkdown(md, opts)
    expect(cs.map(c => c.section)).toEqual(['Routing', 'Routing > Basic', 'Routing > Basic > Wildcard'])
    expect(cs[0].title).toBe('Routing')
    expect(cs[2].url).toBe('https://hono.dev/docs/api/routing#wildcard')
    expect(cs.every(c => !c.text.includes('title: x'))).toBe(true)
  })

  it('ignores headings inside code fences', () => {
    const md = '# Doc\n\n```sh\n# not a heading\necho hi\n```\n'
    const cs = chunkMarkdown(md, opts)
    expect(cs).toHaveLength(1)
    expect(cs[0].text).toContain('# not a heading')
  })

  it('splits long sections with overlap and never cuts a code fence', () => {
    const para = (i: number) => `Paragraph ${i} ` + 'word '.repeat(60)
    const code = '```ts\n' + 'const x = 1\n\nconst y = 2\n'.repeat(5) + '```'
    const md = '# Long\n\n' + [...Array(20)].map((_, i) => para(i)).join('\n\n') + '\n\n' + code
    const cs = chunkMarkdown(md, { ...opts, maxTokens: 600 })
    expect(cs.length).toBeGreaterThan(3)
    for (let i = 1; i < cs.length; i++) {
      const prevLast = cs[i - 1].text.split('\n\n').at(-1)!
      expect(cs[i].text.startsWith(prevLast)).toBe(true) // overlap carried over
    }
    expect(cs.filter(c => c.text.includes('```ts')).every(c => (c.text.match(/```/g) ?? []).length % 2 === 0)).toBe(true)
  })

  it('skips sections that are only a heading', () => {
    expect(chunkMarkdown('# A\n\n## B\n\ntext\n', opts).map(c => c.section)).toEqual(['A > B'])
  })
})
