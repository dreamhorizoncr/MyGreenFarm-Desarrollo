import { useCallback, useState } from 'react'
import axios from 'axios'
import { appointmentService } from '../services/appointment.ts'
import { getErrorMessage } from '../utils/error.ts'
import type {
  AppointmentRequest,
  AvailableWeek,
} from '../types/appointment.ts'

function extractBackendMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string }
      | string
      | undefined
    if (typeof data === 'string' && data) return data
    if (data && typeof data === 'object' && data.message) return data.message
  }
  return getErrorMessage(err)
}

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
      setSlotsError(extractBackendMessage(err))
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
      setSubmitError(extractBackendMessage(err))
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