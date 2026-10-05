import { useEffect, useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

// Paginates an already-fetched array on the client, for the admin lists whose
// backend endpoints don't (yet) support server-side pagination.
export function useClientPagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  )

  return { currentPage, setPage, totalPages, pageItems }
}
