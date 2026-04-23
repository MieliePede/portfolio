import { useEffect, useRef, useState } from 'react'

interface PgRow {
  pid: number
  usename: string | null
  application_name: string | null
  state: string | null
  wait_event_type: string | null
  wait_event: string | null
  duration_s: number | null
  query: string | null
}

type Status = 'connecting' | 'connected' | 'disconnected'

const WS_URL = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/pg-activity`

export default function PgLiveQueryDemo() {
  const [status, setStatus] = useState<Status>('connecting')
  const [rows, setRows] = useState<PgRow[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.error) {
        setStatus('disconnected')
      } else {
        setStatus('connected')
        setRows(data)
      }
    }

    ws.onerror = () => setStatus('disconnected')
    ws.onclose = () => setStatus('disconnected')

    return () => ws.close()
  }, [])

  const statusBadge = {
    connecting: <span className="status-badge status-badge--connecting"><span className="status-dot" />connecting</span>,
    connected:  <span className="status-badge status-badge--connected"><span className="status-dot" />live</span>,
    disconnected: <span className="status-badge status-badge--disconnected"><span className="status-dot" />disconnected</span>,
  }[status]

  return (
    <div className="demo-card">
      <div className="demo-card-header">
        <div className="demo-card-title">
          pg_stat_activity
          {statusBadge}
        </div>
        <p className="demo-card-desc">
          PostgreSQL's built-in process table — live sessions, states, and running queries. Updates every 2s.
        </p>
      </div>

      <div className="demo-card-body">
        {status === 'disconnected' ? (
          <div className="pg-disconnected">
            <p>
              No database connection. Start the backend with a valid{' '}
              <code>DATABASE_URL</code> to see live PostgreSQL session data here.
            </p>
          </div>
        ) : status === 'connecting' ? (
          <p className="pg-empty">Connecting…</p>
        ) : rows.length === 0 ? (
          <p className="pg-empty">No active sessions (just you!).</p>
        ) : (
          <div className="pg-table-wrap">
            <table className="pg-table">
              <thead>
                <tr>
                  <th>PID</th>
                  <th>User</th>
                  <th>App</th>
                  <th>State</th>
                  <th>Wait</th>
                  <th>Duration(s)</th>
                  <th>Query</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rowClass =
                    r.state === 'active' ? 'row-active'
                    : r.state === 'idle in transaction' ? 'row-idle-tx'
                    : ''
                  return (
                    <tr key={r.pid} className={rowClass}>
                      <td>{r.pid}</td>
                      <td>{r.usename ?? '—'}</td>
                      <td>{r.application_name || '—'}</td>
                      <td className="cell-state">{r.state ?? '—'}</td>
                      <td>{r.wait_event ?? '—'}</td>
                      <td>{r.duration_s ?? '—'}</td>
                      <td title={r.query ?? ''}>{r.query ?? '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
