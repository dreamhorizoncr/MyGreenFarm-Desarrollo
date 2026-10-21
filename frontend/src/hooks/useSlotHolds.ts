import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { appointmentService } from '../services/appointment.ts'
import { getErrorMessage } from '../utils/error.ts'

type SlotStatus = 'HELD' | 'RELEASED' | 'BOOKED'

const HOLDER_KEY = 'mgf_booking_holder'

// Identificador de esta pestaña para apartar horarios; se conserva al recargar la página
function readHolderId(): string {
  const fresh = crypto.randomUUID()
  try {
    const saved = sessionStorage.getItem(HOLDER_KEY)
    if (saved) return saved
    sessionStorage.setItem(HOLDER_KEY, fresh)
  } catch {
    // Sin sessionStorage se usa un identificador nuevo en cada carga
  }
  return fresh
}

// Clave de un horario: "2026-10-21T15:00"
export const slotKey = (date: string, time: string) => `${date}T${time.slice(0, 5)}`

const withoutKey = (set: Set<string>, key: string) => {
  if (!set.has(key)) return set
  const next = new Set(set)
  next.delete(key)
  return next
}

const withKey = (set: Set<string>, key: string) => (set.has(key) ? set : new Set(set).add(key))

// Aparta en el servidor el horario elegido y recibe por Server-Sent Events los horarios
// que otras personas están reservando o ya reservaron, para deshabilitarlos al momento.
export function useSlotHolds() {
  const [holderId] = useState(readHolderId)
  const [heldByOthers, setHeldByOthers] = useState<Set<string>>(() => new Set())
  const [booked, setBooked] = useState<Set<string>>(() => new Set())
  const [myHold, setMyHold] = useState<{ key: string; expiresAt: string } | null>(null)
  const myHoldRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof EventSource === 'undefined') return
    const source = new EventSource(appointmentService.slotEventsUrl())
    source.addEventListener('slot', (event) => {
      try {
        const { slot, status } = JSON.parse((event as MessageEvent<string>).data) as { slot: string; status: SlotStatus }
        const key = slot.slice(0, 16)
        if (status === 'BOOKED') {
          setBooked((current) => withKey(current, key))
          setHeldByOthers((current) => withoutKey(current, key))
          return
        }
        // Los avisos de mi propio apartado no deshabilitan el horario para mí
        if (key === myHoldRef.current) return
        setHeldByOthers((current) => (status === 'HELD' ? withKey(current, key) : withoutKey(current, key)))
      } catch {
        // Un evento mal formado se ignora; el servidor vuelve a validar al reservar
      }
    })
    return () => source.close()
  }, [])

  // Al cerrar o salir de la página se libera el horario para los demás
  useEffect(() => {
    const releaseOnExit = () => {
      if (myHoldRef.current) navigator.sendBeacon?.(appointmentService.releaseHoldUrl(holderId))
    }
    window.addEventListener('pagehide', releaseOnExit)
    return () => {
      window.removeEventListener('pagehide', releaseOnExit)
      releaseOnExit()
    }
  }, [holderId])

  const hold = useCallback(async (key: string) => {
    try {
      const result = await appointmentService.holdSlot(`${key}:00`, holderId)
      myHoldRef.current = key
      setMyHold({ key, expiresAt: result.expiresAt })
      setHeldByOthers((current) => withoutKey(current, key))
      return { ok: true as const, message: null }
    } catch (err) {
      const conflict = axios.isAxiosError(err) && err.response?.status === 409
      if (conflict) setHeldByOthers((current) => withKey(current, key))
      return { ok: false as const, message: getErrorMessage(err) }
    }
  }, [holderId])

  const release = useCallback(() => {
    if (!myHoldRef.current) return
    myHoldRef.current = null
    setMyHold(null)
    appointmentService.releaseHold(holderId).catch(() => undefined)
  }, [holderId])

  // Después de reservar, el servidor ya borró el apartado
  const forget = useCallback(() => {
    myHoldRef.current = null
    setMyHold(null)
  }, [])

  const isUnavailable = useCallback(
    (key: string) => booked.has(key) || (heldByOthers.has(key) && key !== myHold?.key),
    [booked, heldByOthers, myHold],
  )

  return { holderId, myHold, hold, release, forget, isUnavailable }
}
