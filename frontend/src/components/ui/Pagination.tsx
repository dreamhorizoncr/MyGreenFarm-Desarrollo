import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

const LIST_TOP_GAP = 16

function scrollToListStart(pagination: HTMLElement | null) {
  const container = document.getElementById('admin-scroll-container')
  const list = pagination?.closest('section')
  const behavior: ScrollBehavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'

  if (container) {
    const top = list ? list.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - LIST_TOP_GAP : 0
    if (container.scrollTop > top) container.scrollTo({ top: Math.max(0, top), behavior })
    return
  }

  const top = list ? list.getBoundingClientRect().top + window.scrollY - LIST_TOP_GAP : 0
  if (window.scrollY > top) window.scrollTo({ top: Math.max(0, top), behavior })
}

/** Props of {@link Pagination}; pages start at 1. */
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

const MAX_VISIBLE_PAGES = 10

/**
 * Page buttons of a list, with previous and next; changing page scrolls to the top of the list. Hidden
 * when there is only one page.
 */
function Pagination({ currentPage, totalPages, onPageChange }: Readonly<PaginationProps>) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)
  if (totalPages <= 1) return null

  const visiblePages = Math.min(totalPages, MAX_VISIBLE_PAGES)
  const firstVisiblePage = Math.min(
    Math.max(1, currentPage - MAX_VISIBLE_PAGES + 1),
    totalPages - visiblePages + 1,
  )

  const goToPage = (page: number) => {
    scrollToListStart(ref.current)
    onPageChange(page)
  }

  return (
    <div ref={ref} className="mt-lg flex items-center justify-center gap-[8px]">
      <button
        type="button"
        onClick={() => goToPage(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        aria-label={t('common.pagination.previous')}
        className="flex size-[38px] items-center justify-center rounded-full border border-neutral-200 bg-white font-body text-body-lg text-heading transition hover:border-green-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>

      {Array.from({ length: visiblePages }, (_, index) => {
        const page = firstVisiblePage + index

        return (
          <button
            key={page}
            type="button"
            onClick={() => goToPage(page)}
            aria-current={currentPage === page ? 'page' : undefined}
            className={`flex size-[38px] items-center justify-center rounded-full font-body text-body-sm transition ${
              currentPage === page
                ? 'bg-green-500 text-white'
                : 'border border-neutral-200 bg-white text-heading hover:border-green-500'
            }`}
          >
            {page}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        aria-label={t('common.pagination.next')}
        className="flex size-[38px] items-center justify-center rounded-full border border-neutral-200 bg-white font-body text-body-lg text-heading transition hover:border-green-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </div>
  )
}

export default Pagination
