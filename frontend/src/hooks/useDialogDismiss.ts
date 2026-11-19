import { useEffect, type RefObject } from 'react'

/**
 * Closes a native `<dialog>` with Escape or with a click on the backdrop (only when the click also
 * started there, so selecting text and releasing outside does not close it). When it opens with the
 * focus on a button, the focus moves to the dialog itself.
 *
 * @param dialogRef - the dialog
 * @param onDismiss - closes it
 * @param enabled - false to ignore Escape and the backdrop, for example while saving
 */
export function useDialogDismiss(dialogRef: RefObject<HTMLDialogElement | null>, onDismiss: () => void, enabled = true) {
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (!dialog?.open || !(document.activeElement instanceof HTMLButtonElement) || !dialog.contains(document.activeElement)) return
      dialog.tabIndex = -1
      dialog.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [dialogRef])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const isOutsideBox = (event: MouseEvent) => {
      const rect = dialog.getBoundingClientRect()
      return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
    }
    let pressedOutside = false

    const handleCancel = (event: Event) => {
      event.preventDefault()
      if (enabled) onDismiss()
    }
    const handlePointerDown = (event: PointerEvent) => {
      pressedOutside = event.target === dialog && isOutsideBox(event)
    }
    const handleClick = (event: MouseEvent) => {
      const closes = pressedOutside && event.target === dialog && isOutsideBox(event)
      pressedOutside = false
      if (closes && enabled) onDismiss()
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('pointerdown', handlePointerDown)
    dialog.addEventListener('click', handleClick)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('pointerdown', handlePointerDown)
      dialog.removeEventListener('click', handleClick)
    }
  })
}
