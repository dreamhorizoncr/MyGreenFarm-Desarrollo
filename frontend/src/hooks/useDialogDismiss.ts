import { useEffect, type RefObject } from 'react'

export function useDialogDismiss(dialogRef: RefObject<HTMLDialogElement | null>, onDismiss: () => void, enabled = true) {
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
