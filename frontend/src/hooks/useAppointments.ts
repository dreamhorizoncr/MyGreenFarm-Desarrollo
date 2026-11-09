import { useCallback, useRef, useState } from 'react'
import { appointmentService } from '../services/appointment.ts'
import { getErrorMessage } from '../utils/error.ts'
import i18n from '../i18n/index.ts'
import type { AppointmentPage, AppointmentStatus } from '../types/appointment.ts'

export interface AppointmentQuery {
  page: number
  size: number
  status?: AppointmentStatus
  date?: string
  search?: string
  excludePast: boolean
  notBefore: string
}

const EMPTY_PAGE: AppointmentPage = {
  content: [],
  totalPages: 0,
  totalElements: 0,
  number: 0,
  size: 10,
}

function currentLang(): string {
  return (i18n.language ?? 'es').split('-')[0] ?? 'es'
}

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