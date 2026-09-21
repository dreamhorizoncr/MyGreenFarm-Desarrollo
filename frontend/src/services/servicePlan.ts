import { apiClient } from './api.ts'
import type { ServicePlan, ServicePlanRequest, OnvoRawPlan } from '../types/servicePlan.ts'
import type { TranslationItem } from './announcement.ts'

export const servicePlanService = {
  async getActivePlans(): Promise<ServicePlan[]> {
    const response = await apiClient.get<ServicePlan[]>('/service-plans', {
      params: { activeOnly: true },
    })
    return response.data
  },

  async getAllPlans(): Promise<ServicePlan[]> {
    const response = await apiClient.get<ServicePlan[]>('/service-plans')
    return response.data
  },

  async getOnvoRawPlans(): Promise<OnvoRawPlan[]> {
    const response = await apiClient.get<OnvoRawPlan[]>('/service-plans/onvo-raw')
    return response.data
  },

  async createPlan(data: ServicePlanRequest, file: File): Promise<ServicePlan> {
    const formData = new FormData()
    formData.append('data', JSON.stringify({ schedule: data.schedule, includes: data.includes, gatewayPriceId: data.gatewayPriceId }))
    formData.append('file', file)

    const response = await apiClient.post<ServicePlan>('/service-plans', formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  async updatePlan(id: string, data: ServicePlanRequest, file?: File): Promise<ServicePlan> {
    const formData = new FormData()
    formData.append('schedule', data.schedule)
    formData.append('includes', data.includes)
    formData.append('gatewayPriceId', data.gatewayPriceId)
    if (file) formData.append('file', file)

    const response = await apiClient.put<ServicePlan>(`/service-plans/${id}`, formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  async deletePlan(id: string): Promise<void> {
    await apiClient.delete(`/service-plans/${id}`)
  },

  async checkoutPlan(planId: string): Promise<string> {
    const response = await apiClient.post<{ url: string }>(`/service-plans/${planId}/checkout`)
    return response.data.url
  },
  async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
          const response = await apiClient.post<Record<string, string>>('/translations/batch', {
              entityType,
          targetLanguage: targetLanguage?.split('-')[0] || 'es',
              items,
          })
          return response.data
      },
}
