import type { Currency, ExchangeRate, RateSide } from '../types/exchangeRate.ts'

const SYMBOL: Record<Currency, string> = {
  CRC: '₡',
  USD: '$',
  EUR: '€',
}

const DEFAULT_LOCALE = 'es-CR'

export function rateToColones(currency: Currency, side: RateSide, rates: ExchangeRate): number {
  if (currency === 'CRC') return 1
  if (currency === 'USD') return side === 'buy' ? rates.usdBuy : rates.usdSell
  return side === 'buy' ? rates.eurBuy : rates.eurSell
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  side: RateSide,
  rates: ExchangeRate,
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return (amount * rateToColones(from, side, rates)) / rateToColones(to, side, rates)
}

export function formatCurrency(amount: number, currency: Currency, locale = DEFAULT_LOCALE): string {
  const decimals = currency === 'CRC' ? 0 : 2
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatColones(amount: number, locale = DEFAULT_LOCALE): string {
  return `${SYMBOL.CRC}${formatCurrency(amount, 'CRC', locale)}`
}

export function currencySymbol(currency: Currency): string {
  return SYMBOL[currency]
}
