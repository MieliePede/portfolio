import { useEffect, useState } from 'react'

interface Lexeme {
  word: string
  ndoc: number
  nentry: number
}

type Status = 'loading' | 'ready' | 'no-db' | 'no-data'

const BAR_ACCENTS = ['var(--accent1)', 'var(--accent2)', 'var(--accent3)']

export default function LexemeFrequencyDemo() {
  const [status, setStatus] = useState<Status>('loading')
  const [lexemes, setLexemes] = useState<Lexeme[]>([])

  useEffect(() => {
    fetch('/api/search/lexemes?limit=40')
      .then((r) => {
        if (r.status === 503) throw new Error('no-db')
        return r.json()
      })
      .then((data) => {
        if (!data.lexemes?.length) {
          setStatus('no-data')
        } else {
          setLexemes(data.lexemes)
          setStatus('ready')
        }
      })
      .catch((e) => setStatus(e.message === 'no-db' ? 'no-db' : 'no-data'))
  }, [])

  const statusBadge = {
    loading:  <span className="status-badge status-badge--connecting"><span className="status-dot" />loading</span>,
    'no-db':  <span className="status-badge status-badge--disconnected"><span className="status-dot" />no database</span>,
    'no-data': <span className="status-badge status-badge--connecting"><span className="status-dot" />not seeded</span>,
    ready:    <span className="status-badge status-badge--connected"><span className="status-dot" />{lexemes.length} lexemes</span>,
  }[status]

  const max = lexemes[0]?.nentry ?? 1

  return (
    <div className="demo-card">
      <div className="demo-card-header">
        <div className="demo-card-title">
          Lexeme Frequency
          {statusBadge}
        </div>
        <p className="demo-card-desc">
          Top words across all of Moby Dick via <code>ts_stat()</code> — stopwords and
          punctuation already stripped by tsvector.
        </p>
      </div>

      <div className="demo-card-body">
        {(status === 'no-db' || status === 'no-data') && (
          <div className="pg-disconnected">
            <p>
              {status === 'no-db'
                ? 'No database connection.'
                : 'Load Moby Dick first using the search card.'}
            </p>
          </div>
        )}

        {status === 'loading' && <p className="pg-empty">Loading…</p>}

        {status === 'ready' && (
          <ol className="lex-chart">
            {lexemes.map((l, i) => (
              <li key={l.word} className="lex-row">
                <span className="lex-word">{l.word}</span>
                <div className="lex-bar-track">
                  <div
                    className="lex-bar"
                    style={{
                      '--bw': `${(l.nentry / max) * 100}%`,
                      background: BAR_ACCENTS[i] ?? 'var(--accent4)',
                      opacity: i < 3 ? 1 : 0.55,
                      animationDelay: `${i * 18}ms`,
                    } as React.CSSProperties}
                  />
                </div>
                <span className="lex-count">{l.nentry.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
