import { useCallback, useEffect, useState } from 'react'

// Progress lives in this browser only. Every read and write is guarded so the
// site still works if storage is blocked.

const KEY = 'rl-companion.progress.v1'

interface Stored {
  completed: number[]
}

function read(): Stored {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Stored
      if (Array.isArray(parsed.completed)) return parsed
    }
  } catch {
    /* storage unavailable */
  }
  return { completed: [] }
}

function write(value: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

export function useProgress() {
  const [completed, setCompleted] = useState<number[]>(() => read().completed)

  useEffect(() => write({ completed }), [completed])

  const toggle = useCallback((week: number) => {
    setCompleted((prev) => (prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week]))
  }, [])

  return { completed, toggle }
}

export type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setTheme] = useState<Theme | null>(() => {
    try {
      const saved = localStorage.getItem('rl-companion.theme')
      return saved === 'light' || saved === 'dark' ? saved : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme) root.setAttribute('data-theme', theme)
    else root.removeAttribute('data-theme')
    try {
      if (theme) localStorage.setItem('rl-companion.theme', theme)
    } catch {
      /* storage unavailable */
    }
  }, [theme])

  const effective: Theme =
    theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

  return { theme: effective, toggle: () => setTheme(effective === 'dark' ? 'light' : 'dark') }
}
