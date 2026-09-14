import { useCallback, useState } from 'react'
import { servicePlanService } from '../services/servicePlan.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ServicePlan } from '../types/servicePlan.ts'

export function useServicePlans() {
  const [plans, setPlans] = useState<ServicePlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await servicePlanService.getActivePlans()
      setPlans(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  return { plans, loading, error, fetchPlans }
}
