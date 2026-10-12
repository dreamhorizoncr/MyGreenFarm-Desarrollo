import { useLayoutEffect, useState, type RefObject } from 'react'

export interface PopoverPosition {
  // Se usa top al abrir hacia abajo y bottom al abrir hacia arriba.
  top?: number
  bottom?: number
  left: number
}

const GAP = 4
const VIEWPORT_MARGIN = 8

interface UsePopoverPositionOptions {
  triggerRef: RefObject<HTMLElement | null>
  open: boolean
  // Tamaño aproximado del panel, para decidir hacia dónde abrirlo y que no se salga de la pantalla.
  width: number
  height: number
  // start: alineado al borde izquierdo del campo; end: al borde derecho.
  align?: 'start' | 'end'
}

// Posición fixed para paneles flotantes que no se pueden achicar (calendario, reloj).
// Al ser fixed no los recorta el modal aunque tenga scroll (overflow): se abren hacia abajo
// o hacia arriba según el espacio en pantalla, y siguen al campo si el modal se desplaza.
export function usePopoverPosition({ triggerRef, open, width, height, align = 'start' }: UsePopoverPositionOptions) {
  const [position, setPosition] = useState<PopoverPosition | null>(null)

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      const spaceBelow = window.innerHeight - rect.bottom - GAP - VIEWPORT_MARGIN
      const spaceAbove = rect.top - GAP - VIEWPORT_MARGIN
      const openUp = spaceBelow < height && spaceAbove > spaceBelow

      const panelWidth = Math.min(width, window.innerWidth - VIEWPORT_MARGIN * 2)
      const preferredLeft = align === 'end' ? rect.right - panelWidth : rect.left
      const left = Math.max(VIEWPORT_MARGIN, Math.min(preferredLeft, window.innerWidth - panelWidth - VIEWPORT_MARGIN))

      setPosition(openUp
        ? { bottom: window.innerHeight - rect.top + GAP, left }
        : { top: rect.bottom + GAP, left })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, triggerRef, width, height, align])

  // Al cerrar se descarta la posición para que el próximo open la recalcule antes de pintar.
  return open ? position : null
}
