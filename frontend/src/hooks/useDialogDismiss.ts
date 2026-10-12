import { useEffect, type RefObject } from 'react'

// Cierra un <dialog> modal con un clic en el fondo (backdrop) o con Escape, usando los eventos
// nativos del dialog en lugar de onClick/onKeyDown en el JSX (el dialog no es un elemento interactivo).
// Escape se intercepta en el evento "cancel" para que corra la animación de salida (onDismiss)
// en vez de que el navegador cierre el dialog de golpe. Con enabled=false (p. ej. mientras guarda) no cierra.
// Los listeners se conectan en cada render: así siempre usan el onDismiss actual y también funcionan
// con dialogs que se montan más tarde (renderizado condicional) o que React vuelve a montar.
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
