import { parsePhoneNumber } from 'react-phone-number-input'

// Los teléfonos guardados antes sin código de país se interpretan como de Costa Rica
export function toInternationalPhone(phone?: string): { value: string; country?: string } {
  const parsed = phone ? parsePhoneNumber(phone, 'CR') : undefined
  return parsed ? { value: parsed.number, country: parsed.country } : { value: phone ?? '' }
}

// Teléfono legible (+506 8888 8888); si no es un número válido se muestra como se guardó
export function formatPhone(phone: string): string {
  const parsed = parsePhoneNumber(phone, 'CR')
  return parsed?.isValid() ? parsed.formatInternational() : phone
}

// Cédula o DIMEX escritos con guiones o espacios se guardan solo con dígitos; un pasaporte queda igual
export function normalizeIdentification(value: string): string {
  const trimmed = value.trim()
  return /^[\d\s-]+$/.test(trimmed) ? trimmed.replace(/\D/g, '') : trimmed
}

// Cédula física (9 dígitos) como 1-2345-6789 y jurídica (10) como 3-101-234567; el resto sin cambios
export function formatIdentification(value: string): string {
  const digits = normalizeIdentification(value)
  if (/^\d{9}$/.test(digits)) return `${digits.slice(0, 1)}-${digits.slice(1, 5)}-${digits.slice(5)}`
  if (/^\d{10}$/.test(digits)) return `${digits.slice(0, 1)}-${digits.slice(1, 4)}-${digits.slice(4)}`
  return value
}
