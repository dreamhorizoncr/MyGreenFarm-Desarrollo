interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

function Pagination({ currentPage, totalPages, onPageChange }: Readonly<PaginationProps>) {
  if (totalPages <= 1) return null

  // The dashboard scrolls its own container (#admin-scroll-container), not the
  // window, so changing page has to scroll that element back to the top.
  const goToPage = (page: number) => {
    onPageChange(page)
    const container = document.getElementById('admin-scroll-container')
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="mt-lg flex items-center justify-center gap-[8px]">
      <button
        type="button"
        onClick={() => goToPage(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        aria-label="Página anterior"
        className="flex size-[38px] items-center justify-center rounded-full border border-neutral-200 bg-white font-body text-[18px] text-heading transition hover:border-green-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ‹
      </button>

      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1

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
        aria-label="Página siguiente"
        className="flex size-[38px] items-center justify-center rounded-full border border-neutral-200 bg-white font-body text-[18px] text-heading transition hover:border-green-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ›
      </button>
    </div>
  )
}

export default Pagination
