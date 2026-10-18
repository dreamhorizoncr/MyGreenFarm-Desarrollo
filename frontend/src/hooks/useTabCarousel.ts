import { useEffect, useRef } from 'react'

// En móvil la fila de pestañas se desliza de lado en vez de bajar a otra línea; desde md vuelve a envolver.
// El padding compensado evita que se recorten el borde y el resaltado de las pestañas.
export const tabCarouselClass =
  'isolate -mx-1 flex gap-sm overflow-x-auto p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden *:shrink-0 *:whitespace-nowrap md:flex-wrap md:overflow-visible'

// Centra en el carrusel la opción activa (la que contiene el TabHighlight o está marcada con aria) cada vez que cambia
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
