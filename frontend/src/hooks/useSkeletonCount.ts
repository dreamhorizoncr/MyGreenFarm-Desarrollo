import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const STORAGE_PREFIX = 'mgf:skeleton-count:'

const seeded = new Map<string, number>()
const listeners = new Set<() => void>()

/**
 * Stores how many items each list has, as the backend reports them on start.
 *
 * @param counts - number of items by list key
 */
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

/**
 * How many placeholders a list's skeleton shows: the count reported by the backend, else the one
 * remembered from the last visit, else the fallback. Once loaded, it remembers how many items there
 * were.
 *
 * @param key - name of the list
 * @param loading - whether the list is loading
 * @param visibleCount - items shown once loaded
 * @param fallback - placeholders when nothing is known
 * @returns the number of placeholders
 */
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
