import { useCallback, useState } from 'react'
import { appointmentService } from '../services/appointment.ts'
import { getErrorMessage } from '../utils/error.ts'
import i18n from '../i18n/index.ts'
import type { Appointment, AppointmentStatus } from '../types/appointment.ts'

function currentLang(): string {
  return (i18n.language ?? 'es').split('-')[0] ?? 'es'
}

function byDateAsc(a: Appointment, b: Appointment) {
  return a.appointmentDate.localeCompare(b.appointmentDate)
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionId, setActionId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchAppointments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await appointmentService.getAppointments()
      setAppointments([...data].sort(byDateAsc))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const runAction = useCallback(
    async (id: string, action: () => Promise<unknown>) => {
      setActionId(id)
      setActionError(null)
      try {
        await action()
        const data = await appointmentService.getAppointments()
        setAppointments([...data].sort(byDateAsc))
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
    appointments,
    loading,
    error,
    actionId,
    actionError,
    fetchAppointments,
    changeStatus,
    rescheduleAppointment,
  }
}