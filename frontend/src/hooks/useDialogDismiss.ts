import { useEffect, type RefObject } from 'react'

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

    const handleCancel = (event: Event) => {
      event.preventDefault()
      if (enabled) onDismiss()
    }
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog && enabled) onDismiss()
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
    }
  })
}
