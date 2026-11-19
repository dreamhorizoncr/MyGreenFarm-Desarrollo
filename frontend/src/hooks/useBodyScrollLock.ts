import { useEffect } from 'react'

let lockCount = 0
let originalOverflow = ''

/**
 * Stops the page from scrolling while the component is mounted, for example behind a modal. Several
 * components can lock it at once: the scroll comes back when the last one unmounts.
 */
export function useBodyScrollLock() {
  useEffect(() => {
    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
    }
    lockCount += 1
    return () => {
      lockCount -= 1
      if (lockCount === 0) document.body.style.overflow = originalOverflow
    }
  }, [])
}
