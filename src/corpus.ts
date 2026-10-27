import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { chunkMarkdown, type Chunk } from './chunk.ts'

const ROOT = new URL('../corpus/', import.meta.url).pathname

// Each folder under corpus/ and how its files map to a public URL.
const SETS: { dir: string; url: (rel: string) => string }[] = [
  { dir: 'hono', url: rel => `https://hono.dev/docs/${rel.replace(/(index)?\.md$/, '')}` },
  { dir: 'policies', url: rel => `policies/${rel.replace(/\.md$/, '')}` },
]

export function loadCorpus(): Chunk[] {
  return SETS.flatMap(({ dir, url }) =>
    (readdirSync(join(ROOT, dir), { recursive: true }) as string[])
      .filter(rel => rel.endsWith('.md'))
      .sort()
      .flatMap(rel =>
        chunkMarkdown(readFileSync(join(ROOT, dir, rel), 'utf8'), {
          source: `${dir}/${rel.replace(/\.md$/, '')}`,
          url: url(rel),
        }),
      ),
  )
}
