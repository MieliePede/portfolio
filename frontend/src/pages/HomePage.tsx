import { useEffect, useState } from 'react'

const ROLES = [
  'Software Engineer',
  'Full-Stack Developer',
  'API Whisperer',
  'Docker Enthusiast',
  'Problem Solver',
]

const LINKS = [
  // { label: 'GitHub', href: 'https://github.com/emilenikel' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/emile-nikel' },
  { label: 'Email', href: 'mailto:nikel.emile@gmail.com' },
]

export default function HomePage() {
  const [roleIndex, setRoleIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const target = ROLES[roleIndex]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && displayed.length < target.length) {
      timeout = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 60)
    } else if (!deleting && displayed.length === target.length) {
      timeout = setTimeout(() => setDeleting(true), 1800)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 35)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setRoleIndex((i) => (i + 1) % ROLES.length)
    }

    return () => clearTimeout(timeout)
  }, [displayed, deleting, roleIndex])

  return (
    <main className="hero">
      <div className="hero-inner">
        <p className="greeting">Hey, I&apos;m</p>
        <h1 className="name">
          Emile<br />Nikel
          <span className="name-dot">.</span>
        </h1>
        <p className="role">
          <span className="role-text">{displayed}</span>
          <span className="cursor" aria-hidden="true">|</span>
        </p>
        <nav className="links">
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href} className="link-pill" target="_blank" rel="noreferrer">
              {label}
            </a>
          ))}
        </nav>
      </div>
    </main>
  )
}
