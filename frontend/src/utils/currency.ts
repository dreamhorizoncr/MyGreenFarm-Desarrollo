import type { Currency, ExchangeRate, RateSide } from '../types/exchangeRate.ts'

const SYMBOL: Record<Currency, string> = {
  CRC: '₡',
  USD: '$',
  EUR: '€',
}

const DEFAULT_LOCALE = 'es-CR'

/**
 * Colones que vale 1 unidad de la moneda dada. El colón no tiene tasa: es la
 * moneda pivote contra la que vienen publicadas todas las demás.
 */
export function rateToColones(currency: Currency, side: RateSide, rates: ExchangeRate): number {
  if (currency === 'CRC') return 1
  if (currency === 'USD') return side === 'buy' ? rates.usdBuy : rates.usdSell
  return side === 'buy' ? rates.eurBuy : rates.eurSell
}

/**
 * Convierte pasando siempre por colones, así que entre USD y EUR el resultado
 * sale de dividir una tasa por la otra. Si ambos lados son la misma moneda
 * devuelve el monto intacto.
 */
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
