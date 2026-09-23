import { useEffect, useState } from 'react'

// Validated categorical palette (fixed order, stepped separately for each theme).
const SERIES_LIGHT = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const SERIES_DARK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']

export function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains('dark')))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

export function useChartTheme() {
  const dark = useIsDark()
  return {
    dark,
    series: dark ? SERIES_DARK : SERIES_LIGHT,
    accent: dark ? '#8b5cf6' : '#7c3aed',
    muted: dark ? '#3a3a50' : '#d9d9e6',
    grid: dark ? '#262636' : '#ececf3',
    axis: dark ? '#8e8ea6' : '#6b6b80',
    surface: dark ? '#13131d' : '#ffffff',
  }
}

/** Folds categories beyond `max` into "Other" so we never exceed the palette. */
export function foldOther<T extends { name: string; value: number }>(rows: T[], max = 6) {
  const sorted = [...rows].sort((a, b) => b.value - a.value)
  if (sorted.length <= max) return sorted
  const head = sorted.slice(0, max - 1)
  const rest = sorted.slice(max - 1).reduce((s, r) => s + r.value, 0)
  return [...head, { name: 'Other', value: rest } as T]
}
