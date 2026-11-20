import { useCallback, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { appointmentService } from '../services/appointment.ts'
import { getErrorMessage } from '../utils/error.ts'

/** Events of the slots stream. */
type SlotStatus = 'HELD' | 'RELEASED' | 'BOOKED'

const HOLDER_KEY = 'mgf_booking_holder'

/** @returns the random ID of this tab's form, kept in `sessionStorage` so a reload keeps its hold */
function readHolderId(storageKey: string): string {
  const fresh = crypto.randomUUID()
  try {
    const saved = sessionStorage.getItem(storageKey)
    if (saved) return saved
    sessionStorage.setItem(storageKey, fresh)
  } catch {
    // Without sessionStorage a new ID is used on every load
  }
  return fresh
}

/**
 * @param date - day, `yyyy-MM-dd`
 * @param time - start time, `HH:mm` or `HH:mm:ss`
 * @returns the key of the slot, `yyyy-MM-ddTHH:mm`
 */
export const slotKey = (date: string, time: string) => `${date}T${time.slice(0, 5)}`

const withoutKey = (set: Set<string>, key: string) => {
  if (!set.has(key)) return set
  const next = new Set(set)
  next.delete(key)
  return next
}

const withKey = (set: Set<string>, key: string) => (set.has(key) ? set : new Set(set).add(key))

/**
 * Holds of the booking slots: listens to the slots held, released or booked by others (Server-Sent
 * Events), holds the slot this form chooses and releases it when the page closes.
 *
 * @param storageKey - `sessionStorage` key of the form's ID; the chat uses its own
 * @param listening - whether to keep the events stream open; the chat only opens it while booking
 * @returns the form's ID, its hold, `hold`, `release`, `forget` (after booking) and `isUnavailable`
 */
export function useSlotHolds(storageKey: string = HOLDER_KEY, listening = true) {
  const [holderId] = useState(() => readHolderId(storageKey))
  const [heldByOthers, setHeldByOthers] = useState<Set<string>>(() => new Set())
  const [booked, setBooked] = useState<Set<string>>(() => new Set())
  const [myHold, setMyHold] = useState<{ key: string; expiresAt: string } | null>(null)
  const myHoldRef = useRef<string | null>(null)

  useEffect(() => {
    if (!listening || typeof EventSource === 'undefined') return
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
        if (key === myHoldRef.current) return
        setHeldByOthers((current) => (status === 'HELD' ? withKey(current, key) : withoutKey(current, key)))
      } catch {
        // Ignore malformed events; the server validates again when booking
      }
    })
    return () => source.close()
  }, [listening])

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
