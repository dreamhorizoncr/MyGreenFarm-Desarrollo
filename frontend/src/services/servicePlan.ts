import { apiClient } from './api.ts'
import type { ServicePlan, ServicePlanRequest, OnvoRawPlan, ConfirmSinpePayload } from '../types/servicePlan.ts'
import type { TranslationItem } from './announcement.ts'

export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export const servicePlanService = {
  async getActivePlans(page = 0, size = 10): Promise<PageResponse<ServicePlan>> {
    const response = await apiClient.get<PageResponse<ServicePlan>>('/service-plans', {
      params: { activeOnly: true, page, size },
    })
    return response.data
  },

  async getAllPlans(page = 0, size = 10): Promise<PageResponse<ServicePlan>> {
    const response = await apiClient.get<PageResponse<ServicePlan>>('/service-plans', {
      params: { page, size },
    })
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

  async deleteImage(id: string): Promise<ServicePlan> {
    const response = await apiClient.delete<ServicePlan>(`/service-plans/${id}/image`)
    return response.data
  },

  async deletePlan(id: string): Promise<void> {
    await apiClient.delete(`/service-plans/${id}`)
  },

  async checkoutPlan(planId: string): Promise<{ url: string; gatewaySessionId: string }> {
    const response = await apiClient.post<{ url: string; gatewaySessionId: string }>(`/service-plans/${planId}/checkout`)
    return response.data
  },

  async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
    const response = await apiClient.post<Record<string, string>>('/translations/batch', {
      entityType,
      targetLanguage: targetLanguage?.split('-')[0] || 'es',
      items,
    })
    return response.data
  },

  async checkPaymentStatus(gatewaySessionId: string): Promise<{ isPaid: boolean; isFailed: boolean; status: string }> {
    const response = await apiClient.get(`/service-plans/status/${gatewaySessionId}`);
    return response.data;
  },

  async createPaymentIntent(data: { priceId: string; customerEmail: string; description: string }): Promise<any> {
    const response = await apiClient.post('/webhooks/create-intent', data)
    return response.data
  },

  async confirmPayment(data: { paymentIntentId: string; cardNumber: string; expMonth: number; expYear: number; cvc: string; cardHolder: string; }) {
    const response = await apiClient.post('/webhooks/confirm', data);
    return response.data;
  },

  async confirmSinpePayment(payload: ConfirmSinpePayload) {
    const response = await apiClient.post('/webhooks/confirm-sinpe', payload)
    return response.data
  }
}