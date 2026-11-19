import { useCallback, useRef, useState } from 'react'
import { appointmentService } from '../services/appointment.ts'
import { getErrorMessage } from '../utils/error.ts'
import i18n from '../i18n/index.ts'
import type { AppointmentPage, AppointmentStatus } from '../types/appointment.ts'

/** Filters and page of the appointments list. */
export interface AppointmentQuery {
  page: number
  size: number
  status?: AppointmentStatus
  date?: string
  search?: string
  excludePast: boolean
  /** Local date and time; with `excludePast`, appointments before it are hidden. */
  notBefore: string
}

const EMPTY_PAGE: AppointmentPage = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  number: 0,
  size: 10,
  first: true,
  last: true,
}

function currentLang(): string {
  return (i18n.language ?? 'es').split('-')[0] ?? 'es'
}

/**
 * Appointments for the admin list. A request that finishes after a newer one is ignored, so fast
 * filter changes never show stale results.
 *
 * @returns the appointments, the page totals, the loading and error state, which appointment has an
 *   action in progress, and the actions to change its status or reschedule it
 */
export function useAppointments() {
  const [appointmentPage, setAppointmentPage] = useState<AppointmentPage>(EMPTY_PAGE)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const latestQuery = useRef<AppointmentQuery>({
    page: 0,
    size: 10,
    excludePast: true,
    notBefore: new Date().toISOString(),
  })
  const requestId = useRef(0)

  const fetchAppointments = useCallback(async (query: AppointmentQuery) => {
    latestQuery.current = query
    const currentRequestId = ++requestId.current
    setLoading(true)
    setError(null)
    try {
      const data = await appointmentService.getAppointments(query)
      if (currentRequestId === requestId.current) setAppointmentPage(data)
    } catch (err) {
      if (currentRequestId === requestId.current) setError(getErrorMessage(err))
    } finally {
      if (currentRequestId === requestId.current) setLoading(false)
    }
  }, [])

  const runAction = useCallback(
    async (id: string, action: () => Promise<unknown>) => {
      setActionId(id)
      setActionError(null)
      try {
        await action()
        const currentRequestId = ++requestId.current
        const data = await appointmentService.getAppointments(latestQuery.current)
        if (currentRequestId === requestId.current) setAppointmentPage(data)
      } catch (err) {
        const message = getErrorMessage(err)
        setActionError(message)
        throw new Error(message, { cause: err })
      } finally {
        setActionId(null)
      }
    },
    [],
  )

  const changeStatus = useCallback(
    (id: string, status: AppointmentStatus, conclusion?: string) =>
      runAction(id, () => appointmentService.updateStatus(id, status, conclusion, currentLang())),
    [runAction],
  )

  const rescheduleAppointment = useCallback(
    (id: string, newDate: string) =>
      runAction(id, () => appointmentService.reschedule(id, newDate, currentLang())),
    [runAction],
  )

  return {
    appointments: appointmentPage.content,
    totalPages: appointmentPage.totalPages,
    totalElements: appointmentPage.totalElements,
    loading,
    error,
    actionId,
    actionError,
    fetchAppointments,
    changeStatus,
    rescheduleAppointment,
  }
}