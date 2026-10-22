import { parsePhoneNumber } from 'react-phone-number-input'

export function toInternationalPhone(phone?: string): { value: string; country?: string } {
  const parsed = phone ? parsePhoneNumber(phone, 'CR') : undefined
  return parsed ? { value: parsed.number, country: parsed.country } : { value: phone ?? '' }
}

export function formatPhone(phone: string): string {
  const parsed = parsePhoneNumber(phone, 'CR')
  return parsed?.isValid() ? parsed.formatInternational() : phone
}

export function normalizeIdentification(value: string): string {
  const trimmed = value.trim()
  return /^[\d\s-]+$/.test(trimmed) ? trimmed.replace(/\D/g, '') : trimmed
}

export function formatIdentification(value: string): string {
  const digits = normalizeIdentification(value)
  if (/^\d{9}$/.test(digits)) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`
  if (/^\d{10}$/.test(digits)) return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4)}`
  return value
}
