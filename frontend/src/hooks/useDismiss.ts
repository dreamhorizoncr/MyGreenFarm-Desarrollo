import { useEffect, type RefObject } from 'react'

interface UseDismissOptions {
  ref: RefObject<HTMLElement | null>
  isOpen: boolean
  onClose: () => void
  includeClickOutside?: boolean
}

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
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [isOpen, onClose])
}

export default useDismiss