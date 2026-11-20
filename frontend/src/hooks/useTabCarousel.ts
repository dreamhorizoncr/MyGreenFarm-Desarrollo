import { useEffect, useRef } from 'react'

/** Classes of a row of tabs that scrolls sideways on small screens and wraps on larger ones. */
export const tabCarouselClass =
  'isolate -mx-1 flex gap-sm overflow-x-auto p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden *:shrink-0 *:whitespace-nowrap md:flex-wrap md:overflow-visible'

/**
 * Scrolls a row of tabs so the active one is centered, when the row does not fit.
 *
 * @param active - the active tab; the row scrolls when it changes
 * @returns the ref for the row
 */
export function useTabCarousel<T extends HTMLElement = HTMLDivElement>(active: unknown) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const row = ref.current
    if (!row || row.scrollWidth <= row.clientWidth) return
    const tab =
      row.querySelector('[data-tab-highlight]')?.parentElement ??
      row.querySelector<HTMLElement>('[aria-pressed="true"], [aria-selected="true"], [aria-current]')
    if (!tab) return
    row.scrollTo({ left: tab.offsetLeft - (row.clientWidth - tab.clientWidth) / 2, behavior: 'smooth' })
  }, [active])

  return ref
}
