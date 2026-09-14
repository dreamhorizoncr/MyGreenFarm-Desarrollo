import { apiClient } from './api.ts'
import type { ServicePlan, ServicePlanRequest, StripeRawPlan } from '../types/servicePlan.ts'

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

  async getStripeRawPlans(): Promise<StripeRawPlan[]> {
    const response = await apiClient.get<StripeRawPlan[]>('/service-plans/stripe-raw')
    return response.data
  },

  async createPlan(data: ServicePlanRequest, file: File): Promise<ServicePlan> {
    const formData = new FormData()
    formData.append('schedule', data.schedule)
    formData.append('includes', data.includes)
    formData.append('stripePriceId', data.stripePriceId)
    formData.append('file', file)

    const response = await apiClient.post<ServicePlan>('/service-plans', formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  async deletePlan(id: string): Promise<void> {
    await apiClient.delete(`/service-plans/${id}`)
  },

  async createCheckoutSession(stripePlanId: string): Promise<string> {
    const response = await apiClient.post<{ url: string }>('/payments/create-checkout-session', {
      stripePlanId,
    })
    return response.data.url
  },
}
