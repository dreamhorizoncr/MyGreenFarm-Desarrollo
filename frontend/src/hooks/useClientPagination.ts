import { useMemo, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

/**
 * Paginates in the browser a list that is already loaded in full.
 *
 * When the list shrinks (for example after filtering) and the current page no longer exists, it
 * moves to the last page that does.
 *
 * @param items - the whole list
 * @param pageSize - items per page, 10 by default
 * @returns the current page (starting at 1), a setter for it, the number of pages (at least 1) and
 *   the items of the current page
 */
export function useClientPagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))

  // adjusting the state while rendering avoids an extra render with a page that does not exist
  if (page > totalPages) setPage(totalPages)
  const currentPage = Math.min(page, totalPages)

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [items, currentPage, pageSize],
  )

  return { currentPage, setPage, totalPages, pageItems }
}
