export interface ExchangeRate {
  id: number
  /** "YYYY-MM-DD" */
  rateDate: string
  /** Colones que el banco paga por 1 USD */
  usdBuy: number
  /** Colones que cuesta comprar 1 USD */
  usdSell: number
  /** Colones que el banco paga por 1 EUR */
  eurBuy: number
  /** Colones que cuesta comprar 1 EUR */
  eurSell: number
  source: string
  createdAt: string
  updatedAt: string
}

export type Currency = 'CRC' | 'USD' | 'EUR'

/** 'buy' usa la tasa con la que el banco compra, 'sell' la que usa para vender. */
export type RateSide = 'buy' | 'sell'
