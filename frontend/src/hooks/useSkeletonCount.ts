import { useEffect } from 'react'

const STORAGE_PREFIX = 'mgf:skeleton-count:'

function readCount(key: string): number | null {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_PREFIX + key))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

function writeCount(key: string, count: number) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, String(count))
  } catch {
    // Sin almacenamiento disponible se usa el valor por defecto.
  }
}

export function useSkeletonCount(key: string, loading: boolean, visibleCount: number, fallback = 3): number {
  useEffect(() => {
    if (!loading) writeCount(key, Math.max(1, visibleCount))
  }, [key, loading, visibleCount])

  return readCount(key) ?? fallback
}
