import { useEffect, useState } from 'react'

export const MODAL_EXIT_MS = 320

// Lets a modal play its closing animation before the parent actually unmounts it:
// without this, React removes the dialog from the DOM the instant onClose fires,
// so the CSS "modal-out" animation would never get a chance to run.
export function useModalExit(onClose: () => void) {
  const [closing, setClosing] = useState(false)

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(() => {
      onClose()
      // Reset for components that stay mounted across opens (e.g. a widget that
      // owns its own `isOpen` state) — without this, `closing` would stay stuck
      // at `true` and the next `requestClose()` call would be a no-op forever.
      setClosing(false)
    }, MODAL_EXIT_MS)
  }

  return { closing, requestClose }
}

// For modals that stay mounted the whole time and toggle visibility through an
// `isOpen` prop (returning null while closed) instead of being conditionally
// mounted/unmounted by the parent. Delays the switch to `null` so modal-out can play.
export function useModalVisibility(isOpen: boolean) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true)
      setClosing(false)
      return
    }

    if (!shouldRender) return

    setClosing(true)
    const timer = window.setTimeout(() => {
      setShouldRender(false)
      setClosing(false)
    }, MODAL_EXIT_MS)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  return { shouldRender, closing }
}
