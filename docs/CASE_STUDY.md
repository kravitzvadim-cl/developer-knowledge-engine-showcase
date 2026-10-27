# Case study: a docs assistant you can check

## The problem

Ask a docs chatbot "does `c.redirect` default to a 301?" and it often agrees with you, because it sounds plausible. The real default is 302. A wrong answer that looks confident costs more than no answer, because people act on it. With internal policies ("can I commit a test API key?") the cost becomes a compliance issue.

There are two failures behind that:

1. **You can't check the answer.** It cites nothing, or it cites a whole page.
2. **You can't tell when it gets worse.** Someone tweaks the prompt or swaps the model, and quality drifts with no signal.

## What I built

A retrieval-augmented answer engine over the Hono web framework docs and a small engineering policy pack:

- **Every claim cites a numbered source.** The UI opens the exact passage the model was given.
- **It refuses when retrieval is weak** or the question is off topic, and shows the nearest pages instead.
- **A 77-question gold set runs in CI on every relevant pull request.** The build fails if any score drops below target or falls more than 3 points from `main`.

Results: 96% grounded, 95% correct, 100% correct refusals, 2% false refusals, p95 3.7 s, about $0.0004 per answer.

## Decisions and trade-offs

**Postgres + pgvector, run in-process (PGlite).**
- The alternative was a hosted vector database.
- With pgvector, vector search and full-text search sit in the same database, which hybrid retrieval needs.
- Running it in-process means CI and a fresh clone need no service.
- Cost: about 480 MB of RAM at idle, which later decided the hosting (see below).

**Local embeddings and reranker.**
- Retrieval runs without an API key, gives the same result on every machine, and costs nothing per query.
- The LLM is the only paid call, and it is skipped entirely when retrieval is too weak to answer.

**Hybrid search, then a reranker.**
- Vector search alone missed questions that hinge on exact names (`timeout`, a policy clause id). Full-text search catches those, and reciprocal rank fusion merges the two lists without tuning weights.
- A cross-encoder rerank of the top 15 fixed the last two retrieval misses and raised key-fact coverage from 87% to 92%.

**Strict JSON output plus validation, not just prompting.**
- The model must return a schema-checked object with a `citations` array.
- Code rejects any answer that cites a source it wasn't given, or that answers without citing.
- Prompts ask; validation enforces.

**Haiku over Sonnet, chosen by measurement.**
- I ran the full gold set on both models.
- Haiku matched Sonnet on groundedness (96% vs 97%) and correctness (95% for both) at about 1/14 of the cost. It also beat Sonnet on latency.
- I also priced a cheaper-looking alternative model. Per token it worked out more expensive than Haiku, so I dropped it.

**The eval gate compares against `main`, not just fixed thresholds.**
- Fixed thresholds alone would let quality slide from 96% to 91% without a signal.
- The gate reads the baseline committed on `main`, so any drop of more than 3 points fails. Moving the baseline on purpose means committing a new one in the PR, where a reviewer sees it.

## Proving the gate works

A gate that never fails proves nothing, so I opened [PR #1](https://github.com/kravitzvadim-cl/developer-knowledge-engine-showcase/pull/1) to break the system prompt on purpose. It removed "use only the provided sources" and the refusal rule.

- The gate [went red](https://github.com/kravitzvadim-cl/developer-knowledge-engine-showcase/actions/runs/38235125518): correct refusals fell from 100% to 58%.
- Reverting the change [turned it green](https://github.com/kravitzvadim-cl/developer-knowledge-engine-showcase/actions/runs/38235982317).

## What went wrong

**The revert didn't trigger the gate.**
- After the revert, the PR diff against `main` was empty, so the path filter skipped the eval job.
- Fix: the workflow also runs and comments on manual dispatch.

**The CI secret was saved empty.**
- `gh secret set` run without a terminal to type into stored an empty string. Nothing warns you; it only shows up as an auth error when the job runs.
- Fix: set the secret through the web UI. Lesson: check secrets with a cheap smoke call before trusting a red build.

**Memory ruled out the free host I planned.**
- With both local models loaded, the API measured about 900 MB, and the planned free tier has 512 MB.
- I found this by measuring before deploying, not by a crash in production.
- The fix is a host with more memory (a free Hugging Face Docker Space), not a smaller design.

**Markdown residue leaked into answers.**
- The corpus contains VitePress components (`<Badge/>`), admonition fences and `// ---cut---` markers.
- The cleanup had to strip these without also stripping real generics like `hc<AppType>`.

## Known limits

- **The judge is the same model family as the answerer.** That can flatter scores. A different judge model, or a sample of human-graded answers, would tighten this.
- **Two gold questions still fail:**
  - Proxy helper: retrieval finds the intro but not the usage example.
  - JWT middleware: the answer misses a key fact.
- **Rate limits live in memory**, so they hold for one instance only. A shared store is the upgrade path if it ever scales out.
- **The corpus is a snapshot.** There is no re-ingest on docs change yet.

## What I'd do next

1. Use a different-family judge, plus 20 human-graded answers to calibrate it.
2. Re-ingest on a schedule, with a diff of which gold answers changed.
3. Stream answers so the first stop appears in under a second.
