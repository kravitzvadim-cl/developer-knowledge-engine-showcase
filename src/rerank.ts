import { AutoModelForSequenceClassification, AutoTokenizer } from '@huggingface/transformers'

// Cross-encoder: reads question and passage together, so it judges "does this passage answer it"
// far better than comparing two separately made vectors. Small enough to run on CPU per request.
export const RERANK_MODEL = 'Xenova/ms-marco-MiniLM-L-6-v2'

let loaded: Promise<[Awaited<ReturnType<typeof AutoTokenizer.from_pretrained>>, Awaited<ReturnType<typeof AutoModelForSequenceClassification.from_pretrained>>]> | undefined

export async function rerankScores(question: string, passages: string[]): Promise<number[]> {
  loaded ??= Promise.all([
    AutoTokenizer.from_pretrained(RERANK_MODEL),
    AutoModelForSequenceClassification.from_pretrained(RERANK_MODEL, { dtype: 'q8' }),
  ])
  const [tokenizer, model] = await loaded
  const inputs = tokenizer(Array(passages.length).fill(question), {
    text_pair: passages,
    padding: true,
    truncation: true,
    max_length: 256,
  })
  const { logits } = await model(inputs)
  return (logits.tolist() as number[][]).map(r => r[0])
}
