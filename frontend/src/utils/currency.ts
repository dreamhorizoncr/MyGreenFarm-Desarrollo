import type { Currency, ExchangeRate, RateSide } from '../types/exchangeRate.ts'

const SYMBOL: Record<Currency, string> = {
  CRC: '₡',
  USD: '$',
  EUR: '€',
}

const DEFAULT_LOCALE = 'es-CR'

/**
 * @param currency - currency to convert
 * @param side - buy or sell rate
 * @param rates - current exchange rates
 * @returns how many colones one unit of the currency is worth
 */
export function rateToColones(currency: Currency, side: RateSide, rates: ExchangeRate): number {
  if (currency === 'CRC') return 1
  if (currency === 'USD') return side === 'buy' ? rates.usdBuy : rates.usdSell
  return side === 'buy' ? rates.eurBuy : rates.eurSell
}

/**
 * Converts an amount between currencies through the colón.
 *
 * @param amount - amount to convert
 * @param from - its currency
 * @param to - target currency
 * @param side - buy or sell rate
 * @param rates - current exchange rates
 * @returns the converted amount, or 0 for an amount that is not a positive number
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

/**
 * @param amount - amount
 * @param currency - its currency: colones without decimals, the rest with two
 * @param locale - locale for the separators, `es-CR` by default
 * @returns the amount formatted, without the currency symbol
 */
export function formatCurrency(amount: number, currency: Currency, locale = DEFAULT_LOCALE): string {
  const decimals = currency === 'CRC' ? 0 : 2
  return numberFormat(locale, decimals).format(amount)
}

/** Formatters already created, by locale and decimals: creating one is slow, and the price animation formats every frame. */
const numberFormats = new Map<string, Intl.NumberFormat>()

function numberFormat(locale: string, decimals: number): Intl.NumberFormat {
  const key = `${locale}|${decimals}`
  let format = numberFormats.get(key)
  if (!format) {
    format = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    numberFormats.set(key, format)
  }
  return format
}

/**
 * @param amount - amount in colones
 * @param locale - locale for the separators
 * @returns the amount with the colón symbol, for example `₡25 000`
 */
export function formatColones(amount: number, locale = DEFAULT_LOCALE): string {
  return `${SYMBOL.CRC}${formatCurrency(amount, 'CRC', locale)}`
}

/**
 * @param currency - currency
 * @returns its symbol
 */
export function currencySymbol(currency: Currency): string {
  return SYMBOL[currency]
}
