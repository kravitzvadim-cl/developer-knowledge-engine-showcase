import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers'

// Local model: no API key, runs the same on a laptop and in CI.
export const EMBED_MODEL = 'Xenova/bge-small-en-v1.5'
export const EMBED_DIM = 384
const QUERY_PREFIX = 'Represent this sentence for searching relevant passages: '

let extractor: Promise<FeatureExtractionPipeline> | undefined

export async function embed(texts: string[], { query = false } = {}): Promise<number[][]> {
  extractor ??= pipeline('feature-extraction', EMBED_MODEL, { dtype: 'fp32' })
  const fe = await extractor
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += 32) {
    const batch = texts.slice(i, i + 32).map(t => (query ? QUERY_PREFIX + t : t))
    const t = await fe(batch, { pooling: 'cls', normalize: true })
    out.push(...(t.tolist() as number[][]))
  }
  return out
}
