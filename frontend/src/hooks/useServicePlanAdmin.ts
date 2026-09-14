import { useCallback, useState } from 'react'
import { servicePlanService } from '../services/servicePlan.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ServicePlan, StripeRawPlan } from '../types/servicePlan.ts'

export function useServicePlanAdmin() {
  const [plans, setPlans] = useState<ServicePlan[]>([])
  const [stripePlans, setStripePlans] = useState<StripeRawPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [dbPlans, rawPlans] = await Promise.all([
        servicePlanService.getAllPlans(),
        servicePlanService.getStripeRawPlans(),
      ])
      setPlans(dbPlans)
      setStripePlans(rawPlans)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const createPlan = useCallback(async (data: { schedule: string; includes: string; stripePriceId: string }, file: File) => {
    try {
      const created = await servicePlanService.createPlan(data, file)
      setPlans(prev => [...prev, created])
      return created
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

  return { plans, stripePlans, loading, error, fetchAll, createPlan, deletePlan }
}
