import { Routes, Route } from 'react-router-dom'
import { useTheme } from './useTheme'
import ThemePicker from './ThemePicker'
import HomePage from './pages/HomePage'
import './App.css'

export default function App() {
  const { themeId, setThemeId, themes } = useTheme()

  return (
    <div className="page">
      <div className="blobs" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      <ThemePicker themes={themes} current={themeId} onChange={setThemeId} />

      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </div>
  )
}
