import { useLayoutEffect, useState, type RefObject } from 'react'

export interface PopoverPosition {
  top?: number
  bottom?: number
  left: number
}

const GAP = 4
const VIEWPORT_MARGIN = 8

interface UsePopoverPositionOptions {
  triggerRef: RefObject<HTMLElement | null>
  open: boolean
  width: number
  height: number
  align?: 'start' | 'end'
}

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

  return open ? position : null
}
