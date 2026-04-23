import { useState } from 'react'
import { type Theme } from './themes'
import './ThemePicker.css'

interface Props {
  themes: Theme[]
  current: string
  onChange: (id: string) => void
}

export default function ThemePicker({ themes, current, onChange }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="tp-wrap">
      <button
        className="tp-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        title="Change theme"
      >
        <span className="tp-icon">◑</span>
      </button>

      {open && (
        <div className="tp-panel">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`tp-swatch${current === t.id ? ' tp-swatch--active' : ''}`}
              onClick={() => { onChange(t.id); setOpen(false) }}
              title={t.name}
              style={{
                '--s1': t.vars['--accent1'],
                '--s2': t.vars['--accent4'],
                '--s-bg': t.vars['--bg'],
              } as React.CSSProperties}
            >
              <span className="tp-swatch-label">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
