import { useCallback, useEffect, useState } from 'react'
import { availabilityService } from '../services/availability.ts'
import type { ScheduleException, WeeklySchedule } from '../types/availability.ts'
import { getErrorMessage } from '../utils/error.ts'

export function useAvailability() {
  const [weekly, setWeekly] = useState<WeeklySchedule[]>([])
  const [exceptions, setExceptions] = useState<ScheduleException[]>([])
  const [loading, setLoading] = useState(true)
  const [weeklySaving, setWeeklySaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeklyError, setWeeklyError] = useState<string | null>(null)
  const [exceptionError, setExceptionError] = useState<string | null>(null)
  const [weeklySuccess, setWeeklySuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [weeklyData, exceptionData] = await Promise.all([
        availabilityService.getWeekly(),
        availabilityService.getExceptions(),
      ])
      setWeekly(weeklyData)
      setExceptions(exceptionData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const loadTask = window.setTimeout(() => void load(), 0)
    return () => window.clearTimeout(loadTask)
  }, [load])

  const saveWeekly = useCallback(async (schedules: WeeklySchedule[]) => {
    setWeeklySaving(true)
    setWeeklyError(null)
    setWeeklySuccess(false)
    try {
      const saved = await Promise.all(schedules.map((schedule) => availabilityService.saveWeekly(schedule)))
      setWeekly(saved)
      setWeeklySuccess(true)
    } catch (err) {
      const message = getErrorMessage(err)
      setWeeklyError(message)
      throw new Error(message, { cause: err })
    } finally {
      setWeeklySaving(false)
    }
  }, [])

  const saveException = useCallback(async (exception: ScheduleException) => {
    setExceptionError(null)
    try {
      const saved = await availabilityService.saveException(exception)
      setExceptions((current) => {
        const withoutSaved = current.filter((item) => item.id !== saved.id && item.exceptionDate !== saved.exceptionDate)
        return [...withoutSaved, saved].sort((a, b) => a.exceptionDate.localeCompare(b.exceptionDate))
      })
      return saved
    } catch (err) {
      const message = getErrorMessage(err)
      setExceptionError(message)
      throw new Error(message, { cause: err })
    }
  }, [])

  const deleteException = useCallback(async (id: number) => {
    setExceptionError(null)
    try {
      await availabilityService.deleteException(id)
      setExceptions((current) => current.filter((item) => item.id !== id))
    } catch (err) {
      const message = getErrorMessage(err)
      setExceptionError(message)
      throw new Error(message, { cause: err })
    }
  }, [])

  return {
    weekly,
    exceptions,
    loading,
    error,
    weeklySaving,
    weeklyError,
    exceptionError,
    weeklySuccess,
    saveWeekly,
    saveException,
    deleteException,
    reload: load,
  }
}
