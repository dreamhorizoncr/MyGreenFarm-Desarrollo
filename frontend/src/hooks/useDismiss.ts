import { useEffect, type RefObject } from 'react'

/** Options of {@link useDismiss}. */
interface UseDismissOptions {
  ref: RefObject<HTMLElement | null>
  isOpen: boolean
  onClose: () => void
  /** Whether a click outside closes it, true by default. */
  includeClickOutside?: boolean
}

/**
 * Closes a menu or popover with Escape or with a click outside it, while it is open.
 *
 * @param options - the element, whether it is open, and the function that closes it
 */
function useDismiss({
  ref,
  isOpen,
  onClose,
  includeClickOutside = true,
}: UseDismissOptions) {
  useEffect(() => {
    if (!isOpen || !includeClickOutside) return

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, isOpen, includeClickOutside, onClose])

  useEffect(() => {
    if (!isOpen) return

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [isOpen, onClose])
}

export default useDismiss