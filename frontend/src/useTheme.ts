import { useState, useEffect } from 'react'
import { themes, type Theme } from './themes'

export function useTheme() {
  const [themeId, setThemeId] = useState<string>(
    () => localStorage.getItem('theme') ?? 'dark',
  )

  const theme: Theme = themes.find((t) => t.id === themeId) ?? themes[0]

  useEffect(() => {
    const root = document.documentElement
    for (const [key, value] of Object.entries(theme.vars)) {
      root.style.setProperty(key, value)
    }
    localStorage.setItem('theme', theme.id)
  }, [theme])

  return { themeId, setThemeId, themes }
}
