import { parsePhoneNumber } from 'react-phone-number-input'

/**
 * @param phone - phone number, with or without country code (Costa Rica by default)
 * @returns the number in E.164 format and its country, for the phone input; the text as it was if it
 *   cannot be parsed
 */
export function toInternationalPhone(phone?: string): { value: string; country?: string } {
  const parsed = phone ? parsePhoneNumber(phone, 'CR') : undefined
  return parsed ? { value: parsed.number, country: parsed.country } : { value: phone ?? '' }
}

/**
 * @param phone - phone number
 * @returns the number in international format when it is valid, or as it was
 */
export function formatPhone(phone: string): string {
  const parsed = parsePhoneNumber(phone, 'CR')
  return parsed?.isValid() ? parsed.formatInternational() : phone
}

/**
 * @param value - identification number as typed
 * @returns only its digits when it is numeric (hyphens and spaces removed); otherwise the trimmed text,
 *   for example a passport
 */
export function normalizeIdentification(value: string): string {
  const trimmed = value.trim()
  return /^[\d\s-]+$/.test(trimmed) ? trimmed.replace(/\D/g, '') : trimmed
}

/**
 * @param value - identification number
 * @returns a Costa Rican ID with its hyphens (`1-2345-6789` for nine digits, `1-234-567890` for ten),
 *   or the value as it was
 */
export function formatIdentification(value: string): string {
  const digits = normalizeIdentification(value)
  if (/^\d{9}$/.test(digits)) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`
  if (/^\d{10}$/.test(digits)) return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4)}`
  return value
}
