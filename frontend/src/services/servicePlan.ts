import { apiClient } from './api.ts'
import type { ServicePlan, ServicePlanRequest, CabysItem, PaymentQuote, ConfirmSinpePayload, ConfirmPaymentPayload } from '../types/servicePlan.ts'
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

  async searchCabys(query: string): Promise<CabysItem[]> {
    const response = await apiClient.get<unknown>('/billing/cabys/search', {
      params: { query },
    })
    const payload = response.data
    if (typeof payload !== 'object' || payload === null) {
      throw new Error('El catálogo CABYS devolvió una respuesta inválida.')
    }

    const body = payload as Record<string, unknown>
    const rawItems = Array.isArray(body.items)
      ? body.items
      : Array.isArray(body.data)
        ? body.data
        : typeof body.codigo === 'string'
          ? [body]
          : []

    return rawItems.map((rawItem): CabysItem => {
      if (typeof rawItem !== 'object' || rawItem === null) {
        throw new Error('El catálogo CABYS devolvió un resultado inválido.')
      }
      const item = rawItem as Record<string, unknown>
      const rawCategories = item.categorias ?? item.categories
      
      const descripcion = typeof item.descripcion === 'string' 
        ? item.descripcion 
        : typeof item.nombre === 'string' 
          ? item.nombre 
          : ''

      const impuesto = Number(item.impuesto)
      if (typeof item.codigo !== 'string' || !Number.isFinite(impuesto) || impuesto < 0) {
        throw new Error('El catálogo CABYS devolvió un código o impuesto inválido.')
      }
      if (rawCategories !== undefined
        && typeof rawCategories !== 'string'
        && (!Array.isArray(rawCategories) || !rawCategories.every((category: unknown) => typeof category === 'string'))) {
        throw new Error('El catálogo CABYS devolvió categorías inválidas.')
      }
      const categories = typeof rawCategories === 'string'
        ? rawCategories
        : Array.isArray(rawCategories)
          ? rawCategories.filter((category: unknown): category is string => typeof category === 'string')
          : undefined
      return {
        codigo: item.codigo,
        categorias: categories,
        descripcion,
        impuesto,
        estado: typeof item.estado === 'string' ? item.estado : undefined,
      }
    })
  },

  async createPlan(data: ServicePlanRequest, file: File): Promise<ServicePlan> {
    const formData = new FormData()
    formData.append('data', JSON.stringify(data))
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
    formData.append('imageAlt', data.imageAlt ?? '')
    if (data.cabysCode) formData.append('cabysCode', data.cabysCode)
    if (data.taxRate !== undefined) formData.append('taxRate', String(data.taxRate))
    if (data.couponCode) formData.append('couponCode', data.couponCode)
    if (data.couponType) formData.append('couponType', data.couponType)
    if (data.couponValue !== undefined) formData.append('couponValue', String(data.couponValue))
    if (data.couponExpiresAt) formData.append('couponExpiresAt', data.couponExpiresAt)
    if (data.couponMaxRedemptions !== undefined) formData.append('couponMaxRedemptions', String(data.couponMaxRedemptions))
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

  async createPaymentIntent(data: {
    servicePlanId: string
    customerEmail: string
    description: string
    paymentMethod?: 'card' | 'sinpe'
    language?: string
    couponCode?: string
    saveSubscription?: boolean
  }): Promise<any> {
    const response = await apiClient.post('/webhooks/create-intent', data)
    return response.data
  },

  async quoteVariablePlan(data: {
    servicePlanId: string
    couponCode?: string
    paymentMethod: 'card' | 'sinpe'
    saveSubscription?: boolean
    cabysCode?: string
  }): Promise<PaymentQuote> {
    const response = await apiClient.post('/webhooks/quote', data)
    return response.data
  },

  async confirmPayment(data: ConfirmPaymentPayload) {
    const response = await apiClient.post('/webhooks/confirm', data);
    return response.data;
  },

  async confirmSinpePayment(payload: ConfirmSinpePayload) {
    const response = await apiClient.post('/webhooks/confirm-sinpe', payload)
    return response.data
  }
}