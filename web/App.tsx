import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import type { Answer } from '../src/answer.ts'
import { scores } from '../evals/baseline.json'

const API = import.meta.env.VITE_API_URL ?? ''
const REPO = 'https://github.com/kravitzvadim-cl/developer-knowledge-engine-showcase'
const KEY = 'access-code'
const stored = () => { try { return localStorage.getItem(KEY) ?? '' } catch { return '' } }
const store = (c: string) => { try { c ? localStorage.setItem(KEY, c) : localStorage.removeItem(KEY) } catch {} }

// Each retrieved source [n] rides its own line, like a subway route bullet.
const LINES = ['#ee352e', '#0039a6', '#00933c', '#fccc0a', '#ff6319']
const lineOf = (n: number) => LINES[(n - 1) % LINES.length]
const darkInk = (n: number) => (n - 1) % LINES.length >= 3

const TRIPS = [
  { q: 'How do I enable CORS for my API routes?', tag: 'How-to' },
  { q: 'Can I commit an API key to a private repository?', tag: 'Company policy' },
  { q: 'How do I share API types between my server and a client?', tag: 'Multi-step' },
  { q: 'c.redirect defaults to a 301 permanent redirect, right?', tag: 'False premise' },
  { q: 'How do I configure middleware in Express.js?', tag: 'Off the map' },
]

type Source = Answer['sources'][number]
type Turn = { id: number; question: string; answer?: Answer; error?: string }
type Selected = { turn: number; n: number; manual?: boolean }

export function App() {
  const [code, setCode] = useState(stored)
  const lock = () => { store(''); setCode('') }
  if (!code) return <Gate onUnlock={c => { store(c); setCode(c) }} />
  return <Engine code={code} onLocked={lock} />
}

// Invite-only: the API refuses questions without a code, so this screen is the only thing a stranger sees.
function Gate({ onUnlock }: { onUnlock: (code: string) => void }) {
  const [value, setValue] = useState(() => new URLSearchParams(location.search).get('code') ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(e?: FormEvent) {
    e?.preventDefault()
    const c = value.trim()
    if (!c || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/unlock`, { headers: { 'x-access-code': c } })
      if (res.ok) {
        history.replaceState(null, '', location.pathname)
        return onUnlock(c)
      }
      setError(res.status === 401 ? "That code isn't on the guest list. Check the invite and try again." : `The server answered ${res.status}. Please try again.`)
    } catch {
      setError('Could not reach the answer server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }
  // An invite link like ?code=... unlocks in one click.
  useEffect(() => { if (value) void submit() }, [])
  return (
    <div className="app">
      <header className="band">
        <span className="brand">
          <span className="logo" aria-hidden>D</span>
          <span><span className="name">Docs Answer Engine</span><span className="tagline">Invite-only demo</span></span>
        </span>
      </header>
      <main className="feed">
        <section className="directory">
          <h1>Invite only.</h1>
          <p className="lede">This demo is open to people Vadim has invited. Enter the access code from your invite.</p>
          {error && <div className="notice error" role="alert">{error}</div>}
        </section>
      </main>
      <form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="code">Access code</label>
        <input id="code" type="password" value={value} onChange={e => setValue(e.target.value)} placeholder="Access code" autoComplete="off" autoFocus />
        <button type="submit" disabled={busy || !value.trim()}>{busy ? 'Checking' : 'Enter'}</button>
      </form>
    </div>
  )
}

function Engine({ code, onLocked }: { code: string; onLocked: () => void }) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<Selected | null>(null)
  // Guests get a fixed number of questions; null means unlimited or not known yet.
  const [left, setLeft] = useState<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (turns.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns])

  async function ask(question: string) {
    question = question.trim()
    if (question.length < 3 || busy) return
    const id = Date.now()
    setTurns(t => [...t, { id, question }])
    setInput('')
    setBusy(true)
    try {
      const res = await fetch(`${API}/api/ask`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-access-code': code },
        body: JSON.stringify({ question }),
      })
      if (res.status === 401) return onLocked()
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error ?? `The server answered ${res.status}. Please try again.`)
      const a = body as Answer
      setLeft(body.left ?? null)
      setTurns(t => t.map(x => (x.id === id ? { ...x, answer: a } : x)))
      // Open the first cited passage beside the answer on wide screens; on phones the sign is a sheet, so wait for a tap.
      const wide = window.matchMedia('(min-width: 961px)').matches
      setSelected(a.refused || !wide ? null : { turn: id, n: a.citations[0] ?? 1 })
    } catch (e) {
      const msg = e instanceof TypeError ? 'Could not reach the answer server. Check your connection and try again.' : (e as Error).message
      setTurns(t => t.map(x => (x.id === id ? { ...x, error: msg } : x)))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    void ask(input)
  }

  const selTurn = turns.find(t => t.id === selected?.turn)
  const selSource = selected ? selTurn?.answer?.sources[selected.n - 1] : undefined

  return (
    <div className="app">
      <header className="band">
        <a className="brand" href="/" aria-label="Docs Answer Engine, start over">
          <span className="logo" aria-hidden>D</span>
          <span>
            <span className="name">Docs Answer Engine</span>
            <span className="tagline">Hono docs + Northwind policies. Every claim cited, or it says so.</span>
          </span>
        </a>
        <a className="status" href={`${REPO}#answer-quality-baseline`} target="_blank" rel="noreferrer">
          <span><b>{scores.groundedness}%</b> grounded</span>
          <span><b>{scores.correctRefusal}%</b> <span className="long">correct </span>refusals</span>
          <span><b>{scores.cases}</b>{' '}<span className="long">question eval, gated on every PR</span><span className="short">tests on every PR</span></span>
        </a>
      </header>

      <div className={`body ${selSource ? 'with-sign' : ''}`}>
        <main className="feed" aria-live="polite">
          {turns.length === 0 && <Directory onPick={q => void ask(q)} busy={busy} />}

          {turns.map(t => (
            <article key={t.id} className="trip">
              <h2 className="question">{t.question}</h2>
              {!t.answer && !t.error && <Approaching />}
              {t.error && (
                <div className="notice error" role="alert">
                  <strong>Answer not delivered.</strong> {t.error}
                  <button className="retry" onClick={() => void ask(t.question)} disabled={busy}>Try again</button>
                </div>
              )}
              {t.answer && (
                <AnswerRoute
                  a={t.answer}
                  active={selected?.turn === t.id ? selected.n : null}
                  focus={selected?.turn === t.id && selected.manual ? selected.n : null}
                  onPick={n => setSelected(s => (s?.turn === t.id && s.n === n && s.manual ? null : { turn: t.id, n, manual: true }))}
                />
              )}
            </article>
          ))}
          <div ref={endRef} />
        </main>

        {selSource && selected && <StationSign source={selSource} n={selected.n} onClose={() => setSelected(null)} />}
      </div>

      <form className="composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="q">Your question</label>
        <input
          id="q"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={left === null ? 'Ask a question' : left > 0 ? `Ask a question (${left} left)` : 'No questions left in your invite'}
          maxLength={500}
          autoComplete="off"
          autoFocus
        />
        <button type="submit" disabled={busy || input.trim().length < 3}>
          {busy ? 'Routing' : 'Ask'}
          <svg viewBox="0 0 20 20" aria-hidden><path d="M4 10h11M10.5 5.5 15 10l-4.5 4.5" /></svg>
        </button>
      </form>
    </div>
  )
}

function Directory({ onPick, busy }: { onPick: (q: string) => void; busy: boolean }) {
  return (
    <section className="directory">
      <h1>Ask the docs. Every claim stops at its source.</h1>
      <p className="lede">
        Answers come only from the <b>Hono</b> web framework docs and a fictional company policy pack. <span className="lede-more">Click any numbered bullet to read the exact passage the model was given. If the docs don't cover it, you get "No service", not a guess.</span>
        <span className="lede-short"> Tap a numbered bullet to see the exact passage; off-topic questions are refused, not guessed.</span>
      </p>
      <ol className="trips">
        {TRIPS.map((t, i) => (
          <li key={t.q}>
            <button onClick={() => onPick(t.q)} disabled={busy}>
              <Bullet n={i + 1} />
              <span className="trip-q">{t.q}</span>
              <span className="trip-tag">{t.tag}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Bullet({ n, onClick, active, label, hollow }: { n: number; onClick?: () => void; active?: boolean; label?: string; hollow?: boolean }) {
  const style = { '--c': lineOf(n) } as CSSProperties
  const cls = `bullet ${darkInk(n) ? 'ink' : ''} ${active ? 'on' : ''} ${hollow ? 'hollow' : ''}`
  if (!onClick) return <span className={cls} style={style} aria-hidden>{n}</span>
  return (
    <button className={cls} style={style} onClick={onClick} aria-label={label} aria-pressed={active}>
      {n}
    </button>
  )
}

function Approaching() {
  return (
    <div className="approaching" role="status">
      <span className="track" aria-hidden />
      <span>Searching 749 passages, then checking every citation</span>
    </div>
  )
}

function AnswerRoute({ a, active, focus, onPick }: { a: Answer; active: number | null; focus: number | null; onPick: (n: number) => void }) {
  const label = (n: number) => `Source ${n}: ${clean(a.sources[n - 1]?.section ?? '')}`
  if (a.refused)
    return (
      <div className="no-service">
        <div className="no-service-head">
          <strong>No service</strong>
          <span>Not covered in the docs</span>
        </div>
        <p>The indexed sources don't answer this, so nothing was made up. Nearest stations:</p>
        <Legend sources={a.sources.slice(0, 3)} cited={[]} active={active} onPick={onPick} label={label} />
      </div>
    )

  const stops = toStops(a.answer)
  let color = 'var(--rail)'
  return (
    <div className="answer">
      <ol className={`route ${focus ? 'focused' : ''}`}>
        {stops.map((s, i) => {
          if (s.kind === 'code')
            return (
              <li key={i} className="stop code" style={{ '--c': color, '--i': i } as CSSProperties}>
                <pre><code>{s.code}</code></pre>
              </li>
            )
          if (s.cites.length) color = lineOf(s.cites[0])
          const lit = !focus || s.cites.includes(focus)
          return (
            <li key={i} className={`stop ${s.cites.length ? '' : 'plain'} ${lit ? '' : 'off'} ${color === LINES[3] ? 'pale' : ''}`} style={{ '--c': color, '--i': i } as CSSProperties}>
              <span className={`node ${s.cites.length > 1 ? 'transfer' : ''}`}>
                {s.cites.length ? s.cites.map(n => <Bullet key={n} n={n} active={active === n} onClick={() => onPick(n)} label={label(n)} />) : <span className="dot" />}
              </span>
              <p>{inline(s.text)}</p>
            </li>
          )
        })}
      </ol>
      <Legend sources={a.sources} cited={a.citations} active={active} onPick={onPick} label={label} />
      <dl className="meta">
        <div><dt>Confidence</dt><dd className={`conf ${a.confidence}`}>{a.confidence}</dd></div>
        <div><dt>Time</dt><dd>{(a.latencyMs / 1000).toFixed(1)} s</dd></div>
        <div><dt>Cost</dt><dd>${a.usage.costUsd.toFixed(4)}</dd></div>
        <div><dt>Model</dt><dd>{a.model.replace('anthropic/', '')}</dd></div>
      </dl>
    </div>
  )
}

function Legend({ sources, cited, active, onPick, label }: { sources: Source[]; cited: number[]; active: number | null; onPick: (n: number) => void; label: (n: number) => string }) {
  const order = sources.map((s, i) => ({ s, n: i + 1 })).sort((x, y) => Number(cited.includes(y.n)) - Number(cited.includes(x.n)))
  return (
    <ul className="legend" aria-label="Sources">
      {order.map(({ s, n }) => {
        const used = !cited.length || cited.includes(n)
        return (
          <li key={s.id}>
            <button className={`line ${active === n ? 'on' : ''} ${used ? '' : 'unused'}`} onClick={() => onPick(n)} aria-label={label(n)}>
              <Bullet n={n} hollow={!used} />
              <span className="line-title">{clean(s.section)}</span>
              <span className="line-from">{used ? (s.source.startsWith('policies/') ? 'Policy' : 'Hono docs') : 'Not cited'}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function StationSign({ source, n, onClose }: { source: Source; n: number; onClose: () => void }) {
  const external = source.url.startsWith('http')
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <aside className="sign" aria-label={`Source ${n}`} key={source.id}>
      <div className="sign-head">
        <Bullet n={n} />
        <div className="sign-title">
          <h3>{clean(source.section)}</h3>
          <p className="sign-sub">
            <span className="sign-what">Exact passage given to the model</span>
            {external ? (
              <a href={source.url} target="_blank" rel="noreferrer">
                Open on hono.dev
                <svg viewBox="0 0 16 16" aria-hidden><path d="M6 3h7v7M13 3 4 12" /></svg>
              </a>
            ) : (
              <span>Northwind policy pack (fictional)</span>
            )}
          </p>
        </div>
        <button className="close" onClick={onClose} aria-label="Close source">
          <svg viewBox="0 0 16 16" aria-hidden><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>
        </button>
      </div>
      <div className="passage">{rich(source.text)}</div>
    </aside>
  )
}

type Stop = { kind: 'text'; text: string; cites: number[] } | { kind: 'code'; code: string }

// Split an answer into route stops: one per sentence, code blocks as their own stop.
function toStops(answer: string): Stop[] {
  const stops: Stop[] = []
  answer.split(/```[^\n]*\n?([\s\S]*?)```/g).forEach((part, i) => {
    if (i % 2) return void stops.push({ kind: 'code', code: part.trimEnd() })
    for (const para of part.split(/\n{2,}/)) {
      for (let s of para.trim().split(/(?<=[.!?])\s+(?=[A-Z0-9`*"([])/)) {
        // A citation placed after the full stop belongs to the previous sentence.
        const lead = s.match(/^((?:\[\d+\]\s*)+)/)
        const prev = stops[stops.length - 1]
        if (lead && prev?.kind === 'text') {
          prev.cites = [...new Set([...prev.cites, ...[...lead[1].matchAll(/\d+/g)].map(m => Number(m[0]))])]
          s = s.slice(lead[1].length)
        }
        if (!s.trim()) continue
        const cites = [...new Set([...s.matchAll(/\[(\d+)\]/g)].map(m => Number(m[1])))]
        const text = s.replace(/\s*\[\d+\]/g, '').replace(/\s+([.,;:!?])(?=\s|$)/g, '$1').trim()
        stops.push({ kind: 'text', text, cites })
      }
    }
  })
  return stops
}

function inline(s: string): ReactNode[] {
  return s.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((tok, i) => {
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) return <code key={i}>{tok.slice(1, -1)}</code>
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) return <b key={i}>{tok.slice(2, -2)}</b>
    return tok.replace(/^#{1,6}\s+/gm, '')
  })
}

// Doc headings and passages carry VitePress markup (<Badge />, images) that means nothing here.
const clean = (s: string) => s.replace(/<\/?[A-Z]\w*(?:\s[^>]*)?\/>|<[A-Z]\w*\s[^>]*>/g, '').replace(/\s{2,}/g, ' ').replace(/\s+›?\s*$/, '').trim()

// Source passages are Markdown: fences become code blocks, the rest paragraphs. React escapes all text.
function rich(text: string) {
  return text.split(/```[^\n]*\n?([\s\S]*?)```/g).map((p, i) =>
    i % 2 ? (
      <pre key={i}><code>{p.replace(/^\s*\/\/ ---cut---\n/m, '').trimEnd()}</code></pre>
    ) : (
      p.split(/\n{2,}/).filter(x => clean(x.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/^:::.*$/gm, ''))).map((para, j) => <p key={`${i}-${j}`}>{inline(clean(para.replace(/^:::.*$/gm, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '')))}</p>)
    ),
  )
}
