export interface ServicePlan {
  id: string
  name: string
  description: string
  gatewayPriceId: string
  currency?: string;
  type: string
  imageUrl: string
  imageAlt?: string | null
  price: number
  schedule: string
  includes: string
  isActive: boolean
  cabysCode?: string
  taxRate?: number
}

export interface OnvoRawPlan {
  gatewayPriceId: string
  name: string
  description: string
  price: number
  currency: string
  type: string
}

export interface ServicePlanRequest {
  schedule: string
  includes: string
  gatewayPriceId: string
  imageAlt?: string
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
  totalAmount: number
  description: string
  language: string
  cabysCode?: string
  taxRate?: number
}

export interface ConfirmSinpePayload {
  paymentIntentId: string
  phoneNumber: string
  sinpeReference: string
  clientName: string
  clientEmail: string
  identificationType: string
  clientIdentification: string
  totalAmount: number
  description: string
  language: string
  currency: string
  cabysCode?: string
  taxRate?: number
}