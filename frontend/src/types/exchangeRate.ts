/** Exchange rates of the colón for a day, in colones per unit. */
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

/** Currencies in which prices can be shown. */
export type Currency = 'CRC' | 'USD' | 'EUR'

/** Rate to use: the bank's buy or sell price. */
export type RateSide = 'buy' | 'sell'
