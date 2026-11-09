import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

// Count priority: server totals for this visit, then the last count stored in this browser,
// then the fallback. Only the first load of each visit is stored, including 0.
const STORAGE_PREFIX = 'mgf:skeleton-count:'

const seeded = new Map<string, number>()
const listeners = new Set<() => void>()

export function seedSkeletonCounts(counts: Record<string, number>) {
  for (const [key, value] of Object.entries(counts)) {
    if (Number.isInteger(value) && value >= 0) seeded.set(key, value)
  }
  listeners.forEach((notify) => notify())
}

const subscribe = (notify: () => void) => {
  listeners.add(notify)
  return () => {
    listeners.delete(notify)
  }
}

function readCount(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (raw === null) return null
    const value = Number(raw)
    return Number.isInteger(value) && value >= 0 ? value : null
  } catch {
    return null
  }
}

function writeCount(key: string, count: number) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, String(count))
  } catch {
    // Storage unavailable: use the fallback.
  }
}

export function useSkeletonCount(key: string, loading: boolean, visibleCount: number, fallback = 3): number {
  const fromServer = useSyncExternalStore(subscribe, () => seeded.get(key) ?? null)
  const [remembered] = useState(() => readCount(key))
  const saved = useRef(false)

  useEffect(() => {
    if (loading || saved.current) return
    saved.current = true
    const count = Math.max(0, visibleCount)
    writeCount(key, count)
    seeded.set(key, count)
  }, [key, loading, visibleCount])

  return fromServer ?? remembered ?? fallback
}
