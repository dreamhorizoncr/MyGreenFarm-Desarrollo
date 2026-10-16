import { useEffect, useState } from 'react'

export const MODAL_EXIT_MS = 320

export function useModalExit(onClose: () => void) {
  const [closing, setClosing] = useState(false)

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    window.setTimeout(() => {
      onClose()
      setClosing(false)
    }, MODAL_EXIT_MS)
  }

  return { closing, requestClose }
}

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
