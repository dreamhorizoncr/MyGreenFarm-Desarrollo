import { useCallback, useState } from 'react'
import { servicePlanService } from '../services/servicePlan.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ServicePlan, OnvoRawPlan } from '../types/servicePlan.ts'

const ENTITY_TYPE = 'service_plan'

export function useServicePlanAdmin() {
  const [plans, setPlans] = useState<ServicePlan[]>([])
  const [sourcePlans, setSourcePlans] = useState<ServicePlan[]>([])
  const [onvoPlans, setOnvoPlans] = useState<OnvoRawPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async (lang?: string) => {
    setLoading(true)
    setError(null)
    try {
      const [dbPlans, rawPlans] = await Promise.all([
        servicePlanService.getAllPlans(),
        servicePlanService.getOnvoRawPlans(),
      ])
      setSourcePlans(dbPlans)
      setOnvoPlans(rawPlans)

      // Traducción dinámica como en el catálogo público (foro/services).
      // Las cards visibles muestran traducido; el modal edita el original (sourcePlans).
      const targetLang = lang?.split('-')[0]
      const items = dbPlans.flatMap((plan) => [
        ...(plan.name ? [{ entityId: plan.id, fieldName: 'name', originalText: plan.name }] : []),
        ...(plan.description ? [{ entityId: plan.id, fieldName: 'description', originalText: plan.description }] : []),
        ...(plan.schedule ? [{ entityId: plan.id, fieldName: 'schedule', originalText: plan.schedule }] : []),
        ...(plan.includes ? [{ entityId: plan.id, fieldName: 'includes', originalText: plan.includes }] : []),
      ])
      if (targetLang && items.length > 0) {
        try {
          const translated = await servicePlanService.translateBatch(ENTITY_TYPE, targetLang, items)
          setPlans(
            dbPlans.map((plan) => ({
              ...plan,
              name: translated[`${plan.id}:name`] ?? plan.name,
              description: translated[`${plan.id}:description`] ?? plan.description,
              schedule: translated[`${plan.id}:schedule`] ?? plan.schedule,
              includes: translated[`${plan.id}:includes`] ?? plan.includes,
            })),
          )
        } catch {
          // Si falla la traducción se muestra el original
          setPlans(dbPlans)
        }
      } else {
        setPlans(dbPlans)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const createPlan = useCallback(async (data: { schedule: string; includes: string; gatewayPriceId: string }, file: File) => {
    try {
      const created = await servicePlanService.createPlan(data, file)
      setSourcePlans(prev => [...prev, created])
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
      setSourcePlans(prev => prev.map(p => p.id === id ? updated : p))
      setPlans(prev => prev.map(p => p.id === id ? { ...updated } : p))
      return updated
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }, [])

  const deletePlan = useCallback(async (id: string) => {
    try {
      await servicePlanService.deletePlan(id)
      setSourcePlans(prev => prev.filter(p => p.id !== id))
      setPlans(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }, [])

  return { plans, sourcePlans, onvoPlans, loading, error, fetchAll, createPlan, updatePlan, deletePlan }
}
