import type { Currency } from './exchangeRate.ts'

export interface ServicePlan {
  id: string
  name: string
  description: string
  currency?: Currency;
  type: string
  imageUrl: string
  imageAlt?: string | null
  price: number
  schedule: string
  includes: string
  isActive: boolean
  cabysCode?: string
  couponCode?: string | null
}

export interface PaymentQuote {
  servicePlanId: string
  baseAmount: number
  discountAmount: number
  serviceTaxAmount: number
  processingFeeAmount: number
  processingFeeTaxAmount: number
  totalAmount: number
  currency: string
  paymentMethod: 'card' | 'sinpe'
  exchangeRate: number | null
  cabysCode: string
  taxRate: number
  cabysDescription: string
}

export interface ServicePlanRequest {
  schedule: string
  includes: string
  imageAlt?: string
  name?: string
  description?: string
  price?: number
  type?: string
  currency?: string
}

export interface ConfirmPaymentPayload {
  paymentIntentId: string
  cardNumber: string
  expMonth: number
  expYear: number
  cvc: string
  cardHolder: string
  clientName: string
  clientEmail: string
  identificationType: string
  clientIdentification: string
  description: string
  language: string
  servicePlanId: string
  couponCode?: string
  saveSubscription?: boolean
}

export interface ConfirmSinpePayload {
  paymentIntentId: string
  phoneNumber: string
  sinpeReference: string
  clientName: string
  clientEmail: string
  identificationType: string
  clientIdentification: string
  description: string
  language: string
  currency: string
  servicePlanId: string
  couponCode?: string
}