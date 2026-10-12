import type { TFunction } from 'i18next'
import { isValidPhoneNumber } from 'react-phone-number-input'

export function validateIdNumber(
  value: string,
  idType: string,
  t: TFunction,
): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (idType === 'Costarricense') {
    if (!/^\d{9,10}$/.test(trimmed)) return t('validation.idNumberCostarricenseInvalid')
  } else if (!/^[A-Za-z0-9-]{6,20}$/.test(trimmed)) {
    return t('validation.idNumberForeignInvalid')
  }
  return null
}

export function validatePhoneNumber(value: string, t: TFunction): string | null {
  if (!value.trim()) return null
  if (!isValidPhoneNumber(value)) return t('validation.phoneInvalid')
  return null
}

export function validateEmail(value: string, t: TFunction): string | null {
  if (!value) return t('validation.emailRequired')
  const atIndex = value.indexOf('@')
  if (atIndex < 1) return t('validation.emailInvalid')
  const domain = value.slice(atIndex + 1)
  if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.'))
    return t('validation.emailInvalid')
  if (/\s/.test(value)) return t('validation.emailInvalid')
  return null
}

export function validatePassword(value: string, t: TFunction): string | null {
  if (!value) return t('validation.passwordRequired')
  if (value.length < 8) return t('validation.passwordMinLength')
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value)) {
    return t('validation.passwordPattern')
  }
  return null
}

export function validateRequired(value: string, fieldName: string, t: TFunction): string | null {
  if (!value.trim()) return t('validation.fieldRequired', { field: fieldName })
  return null
}

export function validateMinLength(value: string, min: number, t: TFunction): string | null {
  if (value.trim().length < min) return t('validation.minLength', { min })
  return null
}

// Misma regla que Sanitizer.hasMaliciousContent del backend: etiquetas HTML ("<" seguido de letra, "/", "!" o "?")
// o caracteres de control que no sean espacios. Así el formulario avisa en el campo antes de enviar,
// en lugar de que el backend rechace la petición con un error genérico.
const HTML_TAG_START = /<[a-zA-Z/!?]/

// Caracteres de control ASCII salvo los de espacio (\t \n \v \f \r), igual que [\p{Cntrl}&&[^\s]] en Java.
function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    if (code <= 0x08 || (code >= 0x0e && code <= 0x1f) || code === 0x7f) return true
  }
  return false
}

export function hasUnsafeText(value: string | null | undefined): boolean {
  return value != null && (HTML_TAG_START.test(value) || hasControlCharacter(value))
}

export function validateSafeText(value: string | null | undefined, t: TFunction): string | null {
  return hasUnsafeText(value) ? t('validation.unsafeText') : null
}
