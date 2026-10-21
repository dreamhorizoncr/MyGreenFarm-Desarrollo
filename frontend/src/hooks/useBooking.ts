import axios from 'axios'
import { useCallback, useState } from 'react'
import { appointmentService } from '../services/appointment.ts'
import { getErrorMessage } from '../utils/error.ts'
import type {
  AppointmentRequest,
  AvailableWeek,
} from '../types/appointment.ts'

export function useBooking() {
  const [availability, setAvailability] = useState<AvailableWeek>({})
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fetchWeek = useCallback(async (date: string) => {
    setSlotsLoading(true)
    setSlotsError(null)
    try {
      const data = await appointmentService.getAvailableWeek(date)
      setAvailability(data)
    } catch (err) {
      setAvailability({})
      setSlotsError(getErrorMessage(err))
    } finally {
      setSlotsLoading(false)
    }
  }, [])

  const submit = useCallback(async (request: AppointmentRequest) => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await appointmentService.createAppointment(request)
      setSuccess(true)
      return { ok: true as const, message: null, slotTaken: false }
    } catch (err) {
      setSubmitError(getErrorMessage(err))
      const status = axios.isAxiosError(err) ? err.response?.status : undefined
      const message = status !== undefined && status < 500 ? getErrorMessage(err) : null
      return { ok: false as const, message, slotTaken: status === 409 }
    } finally {
      setSubmitting(false)
    }
  }, [])

  return {
    availability,
    slotsLoading,
    slotsError,
    submitting,
    submitError,
    success,
    fetchWeek,
    submit,
    setSuccess,
  }
}