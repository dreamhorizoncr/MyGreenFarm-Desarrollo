import { useEffect, useState } from 'react'

export interface GridColumns {
  base: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
}

const BREAKPOINTS = [
  ['xl', 1280],
  ['lg', 1024],
  ['md', 768],
  ['sm', 640],
] as const

function columnsFor(width: number, columns: GridColumns): number {
  for (const [name, minWidth] of BREAKPOINTS) {
    const value = columns[name]
    if (value && width >= minWidth) return value
  }
  return columns.base
}

export function useGridPageSize(columns: GridColumns, max = 10): number {
  const getSize = () => {
    const width = typeof window === 'undefined' ? 0 : window.innerWidth
    const cols = Math.max(1, columnsFor(width, columns))
    return cols * Math.max(1, Math.floor(max / cols))
  }
  const [size, setSize] = useState(getSize)

  useEffect(() => {
    const update = () => setSize(getSize())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns.base, columns.sm, columns.md, columns.lg, columns.xl, max])

  return size
}
