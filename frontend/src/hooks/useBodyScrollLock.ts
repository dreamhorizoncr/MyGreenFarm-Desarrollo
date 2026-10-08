import { useEffect } from 'react'

// Los <dialog> nativos no bloquean el scroll del fondo por si solos: el
// ::backdrop evita los clics, pero el usuario todavia puede mover la rueda o
// el teclado y scrollear la pagina de atras mientras el modal esta abierto.
// Este hook bloquea ese scroll mientras el componente que lo usa esta montado.
export function useBodyScrollLock() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])
}
