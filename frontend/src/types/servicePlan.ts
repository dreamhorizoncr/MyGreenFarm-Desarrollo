export interface ServicePlan {
  id: string
  name: string
  description: string
  stripePriceId: string
  type: string
  imageUrl: string
  price: number
  schedule: string
  includes: string
  isActive: boolean
}

export interface StripeRawPlan {
  id: string
  priceId: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
}

export interface ServicePlanRequest {
  schedule: string
  includes: string
  stripePriceId: string
}
