import { useEffect, useState } from 'react'

/** Length of the modals' exit animation, in milliseconds. */
export const MODAL_EXIT_MS = 320

/**
 * Closes a modal that decides by itself when to close, after playing its exit animation.
 *
 * @param onClose - called once the animation has finished
 * @returns `closing`, true while the animation plays, and `requestClose`, which starts it (calls
 *   made while it is already closing are ignored)
 */
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

/**
 * Keeps a modal controlled by its parent (`isOpen`) mounted while its exit animation plays.
 *
 * @param isOpen - whether the parent wants the modal open
 * @returns `shouldRender`, whether to mount the modal, and `closing`, true while the exit
 *   animation plays
 */
export function useModalVisibility(isOpen: boolean) {
  const [shouldRender, setShouldRender] = useState(isOpen)
  const [closing, setClosing] = useState(false)
  const [previousIsOpen, setPreviousIsOpen] = useState(isOpen)

  // reacting to the change while rendering avoids showing one frame in the old state
  if (isOpen !== previousIsOpen) {
    setPreviousIsOpen(isOpen)
    if (isOpen) {
      setShouldRender(true)
      setClosing(false)
    } else if (shouldRender) {
      setClosing(true)
    }
  }

  useEffect(() => {
    if (!closing) return
    const timer = window.setTimeout(() => {
      setShouldRender(false)
      setClosing(false)
    }, MODAL_EXIT_MS)
    // reopening the modal during the animation cancels the unmount
    return () => window.clearTimeout(timer)
  }, [closing])

  return { shouldRender, closing }
}
