export type Chunk = {
  id: string
  source: string
  url: string
  title: string
  section: string
  text: string
}

export const approxTokens = (s: string) => Math.ceil(s.split(/\s+/).filter(Boolean).length * 1.3)

type Opts = { source: string; url: string; maxTokens?: number; overlap?: number }

// Split on blank lines, but never inside a code fence.
function blocks(lines: string[]): string[] {
  const out: string[] = []
  let cur: string[] = []
  let fence = false
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    if (!fence && line.trim() === '') {
      if (cur.length) out.push(cur.join('\n'))
      cur = []
    } else cur.push(line)
  }
  if (cur.length) out.push(cur.join('\n'))
  return out
}

// Pack blocks into windows of ~maxTokens, repeating ~overlap of the previous window's tail.
function windows(bs: string[], maxTokens: number, overlap: number): string[] {
  const out: string[] = []
  let cur: string[] = []
  let size = 0
  for (const b of bs) {
    const t = approxTokens(b)
    if (size + t > maxTokens && cur.length) {
      out.push(cur.join('\n\n'))
      const tail: string[] = []
      let tailSize = 0
      for (let i = cur.length - 1; i >= 0 && tailSize + approxTokens(cur[i]) <= maxTokens * overlap; i--) {
        tail.unshift(cur[i])
        tailSize += approxTokens(cur[i])
      }
      cur = tail
      size = tailSize
    }
    cur.push(b)
    size += t
  }
  if (cur.length) out.push(cur.join('\n\n'))
  return out
}

export function chunkMarkdown(md: string, { source, url, maxTokens = 700, overlap = 0.15 }: Opts): Chunk[] {
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, '')
  const sections: { path: string[]; lines: string[] }[] = []
  const path: string[] = []
  let cur = { path: [] as string[], lines: [] as string[] }
  let fence = false
  let title = ''

  for (const line of body.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence
    const h = !fence && line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      sections.push(cur)
      const level = h[1].length
      const text = h[2].trim()
      if (level === 1 && !title) title = text
      path.length = level - 1
      path[level - 1] = text
      cur = { path: path.filter(Boolean), lines: [] }
    } else cur.lines.push(line)
  }
  sections.push(cur)
  title ||= source

  const chunks: Chunk[] = []
  for (const s of sections) {
    const bs = blocks(s.lines)
    if (!bs.length) continue
    const section = s.path.join(' > ') || title
    const anchor = s.path.length > 1 ? `#${slug(s.path.at(-1)!)}` : ''
    for (const text of windows(bs, maxTokens, overlap)) {
      chunks.push({ id: `${source}#${chunks.length}`, source, url: url + anchor, title, section, text })
    }
  }
  return chunks
}

export const slug = (s: string) =>
  s.toLowerCase().replace(/[`*_]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
