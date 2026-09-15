import { useCallback, useState } from 'react'
import { servicePlanService } from '../services/servicePlan.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ServicePlan, OnvoRawPlan } from '../types/servicePlan.ts'

export function useServicePlanAdmin() {
  const [plans, setPlans] = useState<ServicePlan[]>([])
  const [onvoPlans, setOnvoPlans] = useState<OnvoRawPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dbPlans, rawPlans] = await Promise.all([
        servicePlanService.getAllPlans(),
        servicePlanService.getOnvoRawPlans(),
      ])
      setPlans(dbPlans)
      setOnvoPlans(rawPlans)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const createPlan = useCallback(async (data: { schedule: string; includes: string; gatewayPriceId: string }, file: File) => {
    try {
      const created = await servicePlanService.createPlan(data, file)
      setPlans(prev => [...prev, created])
      return created
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }, [])

  const updatePlan = useCallback(async (id: string, data: { schedule: string; includes: string; gatewayPriceId: string }, file?: File) => {
    try {
      const updated = await servicePlanService.updatePlan(id, data, file)
      setPlans(prev => prev.map(p => p.id === id ? updated : p))
      return updated
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }, [])

  const deletePlan = useCallback(async (id: string) => {
    try {
      await servicePlanService.deletePlan(id)
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }, [])

  return { plans, onvoPlans, loading, error, fetchAll, createPlan, updatePlan, deletePlan }
}
