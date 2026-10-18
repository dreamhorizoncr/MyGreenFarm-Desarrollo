import { useEffect } from 'react'

// Contador compartido: con modales apilados (p. ej. noticia + visor de fotos) el scroll solo se
// libera cuando se cierra el último, sin depender del orden en que se desmonten
let lockCount = 0
let originalOverflow = ''

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
