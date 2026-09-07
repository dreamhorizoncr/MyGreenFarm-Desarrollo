import { useCallback, useState } from 'react'
import { appointmentService } from '../services/appointment.ts'
import { getApiErrorMessage } from '../utils/error.ts'
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
      setSlotsError(getApiErrorMessage(err))
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
    } catch (err) {
      setSubmitError(getApiErrorMessage(err))
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