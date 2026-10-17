import { useCallback, useRef, useState } from 'react'
import { parseSchedule } from '../utils/schedule.ts'
import { servicePlanService } from '../services/servicePlan.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ServicePlan } from '../types/servicePlan.ts'

const ENTITY_TYPE = 'service_plan'

interface CacheData {
  plans: ServicePlan[]
  totalPages: number
}

export function useServicePlans() {
  const [plans, setPlans] = useState<ServicePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)

  const cacheRef = useRef<Map<string, CacheData>>(new Map())

  const fetchPlans = useCallback(async (page = 0, lang?: string) => {
    const targetLang = lang?.split('-')[0] || 'es'
    const cacheKey = `${page}-${targetLang}`

    if (cacheRef.current.has(cacheKey)) {
      const cached = cacheRef.current.get(cacheKey)!
      setPlans(cached.plans)
      setTotalPages(cached.totalPages)
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const data = await servicePlanService.getActivePlans(page)
      const rawPlans = data.content ?? data 
      const calculatedTotalPages = data.totalPages ?? 1

      setTotalPages(calculatedTotalPages)
      setPlans(rawPlans) 

      let processedPlans = rawPlans

      try {
        const items = rawPlans.flatMap((plan) => [
          { entityId: plan.id, fieldName: 'name', originalText: plan.name },
          { entityId: plan.id, fieldName: 'description', originalText: plan.description },
          ...(parseSchedule(plan.schedule) ? [] : [{ entityId: plan.id, fieldName: 'schedule', originalText: plan.schedule }]),
          { entityId: plan.id, fieldName: 'includes', originalText: plan.includes },
        ])

        const translated: Record<string, string> = items.length > 0
          ? await servicePlanService.translateBatch(ENTITY_TYPE, targetLang, items).catch(() => ({} as Record<string, string>))
          : {}

        processedPlans = rawPlans.map((plan) => ({
          ...plan,
          name: translated[`${plan.id}:name`] ?? plan.name,
          description: translated[`${plan.id}:description`] ?? plan.description,
          schedule: translated[`${plan.id}:schedule`] ?? plan.schedule,
          includes: translated[`${plan.id}:includes`] ?? plan.includes,
        }))

        setPlans(processedPlans)
      } catch {
        processedPlans = rawPlans
      }

      cacheRef.current.set(cacheKey, {
        plans: processedPlans,
        totalPages: calculatedTotalPages,
      })

    } catch (err) {
      if (cacheRef.current.has(cacheKey)) {
        const cached = cacheRef.current.get(cacheKey)!
        setPlans(cached.plans)
        setTotalPages(cached.totalPages)
        setError(null)
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  return { plans, loading, error, fetchPlans, totalPages }
}