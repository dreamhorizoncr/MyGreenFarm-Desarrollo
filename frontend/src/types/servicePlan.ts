export interface ServicePlan {
  id: string
  name: string
  description: string
  gatewayPriceId: string
  type: string
  imageUrl: string
  price: number
  schedule: string
  includes: string
  isActive: boolean
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
}
