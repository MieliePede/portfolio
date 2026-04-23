import { useCallback, useEffect, useRef, useState } from 'react'

interface SearchResult {
  chapter_num: number
  chapter_title: string
  headline: string
  rank: number
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  sql: string
  error?: string
}

interface StatusResponse {
  ready: boolean
  count?: number
  reason?: string
}

type DbStatus = 'checking' | 'no-db' | 'no-data' | 'ready'
type SeedStatus = 'idle' | 'seeding' | 'error'

export default function TsvectorSearchDemo() {
  const [dbStatus, setDbStatus] = useState<DbStatus>('checking')
  const [seedStatus, setSeedStatus] = useState<SeedStatus>('idle')
  const [passageCount, setPassageCount] = useState(0)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [sql, setSql] = useState('')
  const [searching, setSearching] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/search/status')
      .then((r) => r.json())
      .then((data: StatusResponse) => {
        if (data.reason === 'no_db') {
          setDbStatus('no-db')
        } else if (data.ready) {
          setPassageCount(data.count ?? 0)
          setDbStatus('ready')
        } else {
          setDbStatus('no-data')
        }
      })
      .catch(() => setDbStatus('no-db'))
  }, [])

  const handleSeed = async () => {
    setSeedStatus('seeding')
    try {
      const r = await fetch('/api/search/seed', { method: 'POST' })
      const data = await r.json()
      setPassageCount(data.count)
      setDbStatus('ready')
      setSeedStatus('idle')
    } catch {
      setSeedStatus('error')
    }
  }

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setTotal(null)
      setSql('')
      return
    }
    setSearching(true)
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`)
      const data: SearchResponse = await r.json()
      setResults(data.results)
      setTotal(data.total)
      setSql(data.sql)
    } catch {
      // leave previous results visible
    } finally {
      setSearching(false)
    }
  }, [])

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(val), 320)
  }

  const statusBadge = {
    checking: <span className="status-badge status-badge--connecting"><span className="status-dot" />checking</span>,
    'no-db':  <span className="status-badge status-badge--disconnected"><span className="status-dot" />no database</span>,
    'no-data': <span className="status-badge status-badge--connecting"><span className="status-dot" />not seeded</span>,
    ready:    <span className="status-badge status-badge--connected"><span className="status-dot" />{passageCount.toLocaleString()} passages</span>,
  }[dbStatus]

  return (
    <div className="demo-card">
      <div className="demo-card-header">
        <div className="demo-card-title">
          Full-Text Search
          {statusBadge}
        </div>
        <p className="demo-card-desc">
          PostgreSQL tsvector + GIN index searching all of Moby Dick — ranked results,
          keyword-in-context snippets, zero AI.
        </p>
      </div>

      <div className="demo-card-body">
        {dbStatus === 'no-db' && (
          <div className="pg-disconnected">
            <p>No database connection. Start the backend with a valid <code>DATABASE_URL</code> to use this demo.</p>
          </div>
        )}

        {dbStatus === 'checking' && (
          <p className="pg-empty">Checking database…</p>
        )}

        {dbStatus === 'no-data' && (
          <div className="pg-disconnected">
            <p>Database connected but Moby Dick hasn&apos;t been loaded yet.</p>
            <button
              className="seed-btn"
              onClick={handleSeed}
              disabled={seedStatus === 'seeding'}
            >
              {seedStatus === 'seeding' ? 'Loading… (may take ~10s)' : '⬇ Load Moby Dick'}
            </button>
            {seedStatus === 'error' && (
              <p style={{ color: 'var(--accent1)' }}>Failed to fetch the book. Check network access from the backend.</p>
            )}
          </div>
        )}

        {dbStatus === 'ready' && (
          <div className="search-wrap">
            <div className="search-input-wrap">
              <input
                className="search-input"
                type="text"
                placeholder="Search Moby Dick… try &quot;white whale&quot; or &quot;obsession&quot;"
                value={query}
                onChange={handleQueryChange}
                autoFocus
              />
              {searching && <span className="search-spinner" />}
            </div>

            {total !== null && query.trim() && (
              <p className="search-meta">
                {total === 0
                  ? 'No passages found.'
                  : <><strong>{total.toLocaleString()}</strong> passage{total !== 1 ? 's' : ''} match</>}
              </p>
            )}

            {results.length > 0 && (
              <ol className="search-results">
                {results.map((r, i) => (
                  <li key={i} className="search-result">
                    <div className="result-meta">
                      Ch. {r.chapter_num} — {r.chapter_title}
                      <span className="result-rank">rank {r.rank}</span>
                    </div>
                    <div
                      className="result-headline"
                      dangerouslySetInnerHTML={{ __html: r.headline }}
                    />
                  </li>
                ))}
              </ol>
            )}

            {sql && (
              <details className="sql-details">
                <summary>SQL</summary>
                <pre className="sql-block">{sql}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
