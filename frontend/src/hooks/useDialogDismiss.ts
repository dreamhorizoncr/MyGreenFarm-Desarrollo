import { useEffect, useRef, type RefObject } from 'react'

// Cierra un <dialog> modal con un clic en el fondo (backdrop) o con Escape, usando los eventos
// nativos del dialog en lugar de onClick/onKeyDown en el JSX (el dialog no es un elemento interactivo).
// Escape se intercepta en el evento "cancel" para que corra la animación de salida (requestClose)
// en vez de que el navegador cierre el dialog de golpe. Con enabled=false (p. ej. mientras guarda) no cierra.
export function useDialogDismiss(dialogRef: RefObject<HTMLDialogElement | null>, onDismiss: () => void, enabled = true) {
  // Siempre la versión más reciente, sin volver a registrar los listeners en cada render.
  const latest = useRef({ onDismiss, enabled })
  useEffect(() => {
    latest.current = { onDismiss, enabled }
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleCancel = (event: Event) => {
      event.preventDefault()
      if (latest.current.enabled) latest.current.onDismiss()
    }
    const handleClick = (event: MouseEvent) => {
      if (event.target === dialog && latest.current.enabled) latest.current.onDismiss()
    }

    dialog.addEventListener('cancel', handleCancel)
    dialog.addEventListener('click', handleClick)
    return () => {
      dialog.removeEventListener('cancel', handleCancel)
      dialog.removeEventListener('click', handleClick)
    }
  }, [dialogRef])
}
