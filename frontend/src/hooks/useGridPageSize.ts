import { useEffect, useState } from 'react'

/** Columns of a grid at each Tailwind breakpoint; the missing ones inherit the smaller one. */
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

/**
 * @param columns - columns of the grid at each breakpoint
 * @param max - most items a page may have
 * @returns the largest number of items, up to `max`, that fills whole rows at the window's width
 */
function pageSizeFor(columns: GridColumns, max: number): number {
  const width = typeof window === 'undefined' ? 0 : window.innerWidth
  const cols = Math.max(1, columnsFor(width, columns))
  return cols * Math.max(1, Math.floor(max / cols))
}

/**
 * Page size of a paginated grid, so that every page ends with a full row. It is updated when the
 * window is resized.
 *
 * @param columns - columns of the grid at each breakpoint
 * @param max - most items a page may have, 10 by default
 * @returns the number of items per page
 */
export function useGridPageSize(columns: GridColumns, max = 10): number {
  const [size, setSize] = useState(() => pageSizeFor(columns, max))
  // the callers pass a new object on every render, so the effect depends on its values
  const { base, sm, md, lg, xl } = columns

  useEffect(() => {
    const update = () => setSize(pageSizeFor({ base, sm, md, lg, xl }, max))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [base, sm, md, lg, xl, max])

  return size
}
