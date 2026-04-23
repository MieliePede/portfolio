import { Link } from 'react-router-dom'
import TsvectorSearchDemo from '../components/TsvectorSearchDemo'
import LexemeFrequencyDemo from '../components/LexemeFrequencyDemo'
import './FunPage.css'

export default function FunPage() {
  return (
    <main className="fun-page">
      <header className="fun-header">
        <Link to="/" className="link-pill back-pill">← Back</Link>
        <h2 className="fun-title">
          Fun Stuff<span className="name-dot">.</span>
        </h2>
        <p className="fun-subtitle">Interactive demos &amp; experiments</p>
      </header>
      <div className="fun-grid">
        <TsvectorSearchDemo />
        <LexemeFrequencyDemo />
      </div>
    </main>
  )
}
