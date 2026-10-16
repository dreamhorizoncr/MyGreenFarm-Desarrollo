import { useLayoutEffect, useState, type RefObject } from 'react'

export interface MenuPosition {
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

const MENU_GAP = 4
const VIEWPORT_MARGIN = 8
const MIN_MENU_HEIGHT = 40

interface UseMenuPositionOptions {
  triggerRef: RefObject<HTMLElement | null>
  open: boolean
  desiredHeight: number
  maxHeight: number
  minWidth?: number
}

export function useMenuPosition({ triggerRef, open, desiredHeight, maxHeight, minWidth = 0 }: UseMenuPositionOptions) {
  const [position, setPosition] = useState<MenuPosition | null>(null)

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const trigger = triggerRef.current
      const rect = trigger?.getBoundingClientRect()
      if (!trigger || !rect) return
      const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_MARGIN
      const spaceAbove = rect.top - MENU_GAP - VIEWPORT_MARGIN

      const panel = trigger.closest('form, dialog')?.getBoundingClientRect()
      const panelBottom = panel ? Math.min(panel.bottom, window.innerHeight - VIEWPORT_MARGIN) : null
      const panelTop = panel ? Math.max(panel.top, VIEWPORT_MARGIN) : null
      const fitsBelowInPanel = panelBottom !== null && panelBottom - rect.bottom - MENU_GAP >= desiredHeight
      const fitsAboveInPanel = panelTop !== null && rect.top - MENU_GAP - panelTop >= desiredHeight

      let openUp: boolean
      if (fitsBelowInPanel) openUp = false
      else if (fitsAboveInPanel) openUp = true
      else openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow

      const height = Math.min(maxHeight, Math.max(openUp ? spaceAbove : spaceBelow, MIN_MENU_HEIGHT))
      const width = Math.max(rect.width, minWidth)
      const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, window.innerWidth - width - VIEWPORT_MARGIN))
      setPosition(openUp
        ? { bottom: window.innerHeight - rect.top + MENU_GAP, left, width, maxHeight: height }
        : { top: rect.bottom + MENU_GAP, left, width, maxHeight: height })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, triggerRef, desiredHeight, maxHeight, minWidth])

  return open ? position : null
}
