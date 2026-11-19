import type { Currency } from './exchangeRate.ts'

/** Service plan offered to families. */
export interface ServicePlan {
  id: string
  name: string
  description: string
  currency?: Currency;
  /** Billing period, for example `MONTHLY` or `3_MONTHS`; see {@link getPlanTypeLabel}. */
  type: string
  imageUrl: string
  imageAlt?: string | null
  price: number
  schedule: string
  includes: string
  isActive: boolean
  /** Code of the service in the CABYS catalog, for the electronic invoice. */
  cabysCode?: string
  couponCode?: string | null
}

/** Breakdown of the price to pay for a plan. */
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

/** Data to create or update a plan. */
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

/** Card payment of a payment intent, with the customer's billing data. */
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

/** SINPE Móvil payment of a payment intent, with the customer's billing data. */
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

/** Result of confirming a payment with the gateway. */
export interface PaymentConfirmation {
  /** Gateway status, for example `succeeded`, `processing` or `requires_action`. */
  status: string
  /** Why the recurring subscription could not be created, when the payment itself went through. */
  subscriptionError?: string
  /** Why the electronic invoice could not be issued, when the payment itself went through. */
  invoiceError?: string
}
