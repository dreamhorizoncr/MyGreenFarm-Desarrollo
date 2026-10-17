export interface ExchangeRate {
  id: number
  rateDate: string
  usdBuy: number
  usdSell: number
  eurBuy: number
  eurSell: number
  source: string
  createdAt: string
  updatedAt: string
}

export type Currency = 'CRC' | 'USD' | 'EUR'

export type RateSide = 'buy' | 'sell'
