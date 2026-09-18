import { useCallback, useState } from 'react'
import { servicePlanService } from '../services/servicePlan.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ServicePlan } from '../types/servicePlan.ts'

const SOURCE_LANG = 'es'
const ENTITY_TYPE = 'service_plan'

export function useServicePlans() {
  const [plans, setPlans] = useState<ServicePlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = useCallback(async (lang: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await servicePlanService.getActivePlans()

      let result = data
      if (lang !== SOURCE_LANG) {
        const items = data.flatMap((plan) => [
          { entityId: plan.id, fieldName: 'name', originalText: plan.name },
          { entityId: plan.id, fieldName: 'description', originalText: plan.description },
          { entityId: plan.id, fieldName: 'schedule', originalText: plan.schedule },
          { entityId: plan.id, fieldName: 'includes', originalText: plan.includes },
        ])
        const translated = await servicePlanService.translateBatch(ENTITY_TYPE, lang, items)
        result = data.map((plan) => ({
          ...plan,
          name: translated[`${plan.id}:name`] ?? plan.name,
          description: translated[`${plan.id}:description`] ?? plan.description,
          schedule: translated[`${plan.id}:schedule`] ?? plan.schedule,
          includes: translated[`${plan.id}:includes`] ?? plan.includes,
        }))
      }

      setPlans(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  return { plans, loading, error, fetchPlans }
}
