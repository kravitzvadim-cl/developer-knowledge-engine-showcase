# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters and hiring managers evaluating the author's portfolio (AI Builder, AI Automation, Technical PM roles). They arrive from a CV or LinkedIn link, have about 10 seconds to understand what this is, and should then try one question and verify a citation. Secondary: developers asking real questions about the Hono docs and the Northwind policy pack.

## Product Purpose

A retrieval-augmented answer engine over a developer doc set and an engineering policy pack. It answers with a citation on every claim, refuses when the sources don't cover the question, and a CI eval gate blocks any change that lowers answer quality. Success: a visitor understands the point and checks a source in one click.

## Positioning

Not "a chatbot over docs". The difference is proof: every claim links to the exact passage the model was given, refusals are honest and show the closest passages, and quality is measured on a 77-question gold set and enforced on every pull request (a weakened prompt was shown to turn CI red).

## Operating Context

Visitors open the live link on desktop or phone, usually once. They click a suggested question, read the cited answer, click a citation number to open the source passage, and may follow through to the GitHub repo, eval table and red/green CI proof.

## Capabilities and Constraints

- Corpus: Hono docs snapshot (MIT) and a synthetic "Northwind" policy pack (secrets SEC, code review CR, data retention DR); fictional, not legal advice.
- Answering model: Claude Haiku 5.5 via OpenRouter; about $0.0004 and 2 to 4 s per answer.
- Answer shape: `answer`, `citations[]`, `confidence`, `refused`, plus the 5 retrieved sources, model, latency, cost.
- Weak retrieval refuses before calling the model.
- Stack: React + Vite UI (`web/`), Node API (`src/server.ts`). Public deployment planned (UI and API), with rate limiting.

## Evidence on Hand

Real, measured, in `evals/baseline.json` (Haiku) and `evals/baseline-sonnet.json`: groundedness 96%, correctness 96%, correct refusal 100%, retrieval hit@5 97%, false refusal 3%, 77 questions, $0.04 per full run. CI proof: PR #1 red run 38235125518, green run 38235982317. No users, testimonials or production customers exist; never imply them.

## Product Principles

- Show the source, don't ask for trust.
- An honest "not covered" beats a fluent guess.
- Quality is a number, measured and enforced, not claimed.
- Cost and latency are visible, not hidden.
