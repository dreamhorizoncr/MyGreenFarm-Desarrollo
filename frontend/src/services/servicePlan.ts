import { apiClient } from './api.ts'
import type { PageResponse } from '../types/page.ts'
import type { ServicePlan, ServicePlanRequest, PaymentQuote, ConfirmSinpePayload, ConfirmPaymentPayload, PaymentConfirmation } from '../types/servicePlan.ts'
import { translateBatch } from './translation.ts'

/** Service plans and their payment (`/api/service-plans` and the payment gateway). */
export const servicePlanService = {
  /**
   * @param page - page number, starting at 0
   * @param size - plans per page
   * @returns one page of the plans shown to families
   */
  async getActivePlans(page = 0, size = 10): Promise<PageResponse<ServicePlan>> {
    const response = await apiClient.get<PageResponse<ServicePlan>>('/service-plans', {
      params: { activeOnly: true, page, size },
    })
    return response.data
  },

  /**
   * @param page - page number, starting at 0
   * @param size - plans per page
   * @returns one page of all the plans, active or not
   */
  async getAllPlans(page = 0, size = 10): Promise<PageResponse<ServicePlan>> {
    const response = await apiClient.get<PageResponse<ServicePlan>>('/service-plans', {
      params: { page, size },
    })
    return response.data
  },

  /**
   * @param data - the plan's data
   * @param file - the plan's image
   * @returns the created plan
   */
  async createPlan(data: ServicePlanRequest, file: File): Promise<ServicePlan> {
    const formData = new FormData()
    formData.append('data', JSON.stringify(data))
    formData.append('file', file)

    const response = await apiClient.post<ServicePlan>('/service-plans', formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  /**
   * @param id - plan's ID
   * @param data - new data
   * @param file - new image, optional
   * @returns the updated plan
   */
  async updatePlan(id: string, data: ServicePlanRequest, file?: File): Promise<ServicePlan> {
    const formData = new FormData()
    formData.append('name', data.name ?? '')
    formData.append('description', data.description ?? '')
    formData.append('price', String(data.price ?? ''))
    formData.append('type', data.type ?? '')
    formData.append('currency', data.currency ?? '')
    formData.append('schedule', data.schedule)
    formData.append('includes', data.includes)
    formData.append('imageAlt', data.imageAlt ?? '')
    if (file) formData.append('file', file)

    const response = await apiClient.put<ServicePlan>(`/service-plans/${id}`, formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },


  /** @param id - ID of the plan to delete */
  async deletePlan(id: string): Promise<void> {
    await apiClient.delete(`/service-plans/${id}`)
  },

  translateBatch,

  /**
   * Starts a payment with the gateway.
   *
   * @param data - plan, customer and payment method
   * @returns the payment intent's ID
   */
  async createPaymentIntent(data: {
    servicePlanId: string
    customerEmail: string
    description: string
    paymentMethod?: 'card' | 'sinpe'
    language?: string
    couponCode?: string
    saveSubscription?: boolean
  }): Promise<{ id: string }> {
    const response = await apiClient.post<{ id: string }>('/webhooks/create-intent', data)
    return response.data
  },

  /**
   * @param data - plan, coupon and payment method
   * @returns the price to pay, with discounts and taxes
   */
  async quoteVariablePlan(data: {
    servicePlanId: string
    couponCode?: string
    paymentMethod: 'card' | 'sinpe'
    saveSubscription?: boolean
    cabysCode?: string
  }): Promise<PaymentQuote> {
    const response = await apiClient.post<PaymentQuote>('/webhooks/quote', data)
    return response.data
  },

  /**
   * Pays a payment intent by card.
   *
   * @param data - payment intent, card and customer's billing data
   * @returns the result of the payment
   */
  async confirmPayment(data: ConfirmPaymentPayload): Promise<PaymentConfirmation> {
    const response = await apiClient.post<PaymentConfirmation>('/webhooks/confirm', data);
    return response.data
  },

  /**
   * Confirms a payment made by SINPE Móvil.
   *
   * @param payload - payment intent, phone, reference and customer's billing data
   * @returns the result of the payment
   */
  async confirmSinpePayment(payload: ConfirmSinpePayload): Promise<PaymentConfirmation> {
    const response = await apiClient.post<PaymentConfirmation>('/webhooks/confirm-sinpe', payload)
    return response.data
  }
}