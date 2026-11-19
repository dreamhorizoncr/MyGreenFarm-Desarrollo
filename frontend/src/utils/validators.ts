import type { TFunction } from 'i18next'

/**
 * @param value - identification number
 * @param idType - `Costarricense` for a national ID (9 or 10 digits); anything else for a foreign
 *   document (6 to 20 letters, digits or hyphens)
 * @param t - translation function
 * @returns the translated error, or `null` when it is valid or empty
 */
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

/**
 * @param value - identification number: 9 to 12 digits, or 6 to 20 letters, digits or hyphens
 * @param t - translation function
 * @returns the translated error, or `null` when it is valid or empty
 */
export function validateIdentification(value: string, t: TFunction): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const valid = /^\d+$/.test(trimmed) ? /^\d{9,12}$/.test(trimmed) : /^[A-Za-z0-9-]{6,20}$/.test(trimmed)
  return valid ? null : t('validation.identificationInvalid')
}

/**
 * @param value - email
 * @param t - translation function
 * @returns the translated error, or `null` when it is valid
 */
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

/** Email providers accepted when booking a visit. */
export const BOOKING_EMAIL_DOMAINS = ['gmail.com', 'hotmail.com', 'outlook.com']

/**
 * @param value - email
 * @param t - translation function
 * @returns the translated error when the provider is not one of {@link BOOKING_EMAIL_DOMAINS}
 */
export function validateBookingEmailDomain(value: string, t: TFunction): string | null {
  const domain = value.slice(value.indexOf('@') + 1).trim().toLowerCase()
  return BOOKING_EMAIL_DOMAINS.includes(domain) ? null : t('validation.emailDomainNotAllowed')
}

/**
 * @param value - password
 * @param t - translation function
 * @returns the translated error, or `null` when it has at least 8 characters with lower and upper
 *   case, a digit and a symbol
 */
export function validatePassword(value: string, t: TFunction): string | null {
  if (!value) return t('validation.passwordRequired')
  if (value.length < 8) return t('validation.passwordMinLength')
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value)) {
    return t('validation.passwordPattern')
  }
  return null
}

/**
 * @param value - field's value
 * @param fieldName - field's translated name, for the message
 * @param t - translation function
 * @returns the translated error when the field is blank
 */
export function validateRequired(value: string, fieldName: string, t: TFunction): string | null {
  if (!value.trim()) return t('validation.fieldRequired', { field: fieldName })
  return null
}

/**
 * @param value - field's value
 * @param min - fewest characters, not counting the surrounding spaces
 * @param t - translation function
 * @returns the translated error when it is too short
 */
export function validateMinLength(value: string, min: number, t: TFunction): string | null {
  if (value.trim().length < min) return t('validation.minLength', { min })
  return null
}

const HTML_TAG_START = /<[a-zA-Z/!?]/

/** @returns whether the text has control characters other than tab and line breaks */
function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.codePointAt(i) ?? 0
    if (code <= 0x08 || (code >= 0x0e && code <= 0x1f) || code === 0x7f) return true
  }
  return false
}

/**
 * Same rule as the backend's `Sanitizer`, so the form warns before sending.
 *
 * @param value - text typed by the user
 * @returns whether it contains HTML tags or control characters
 */
export function hasUnsafeText(value: string | null | undefined): boolean {
  return value != null && (HTML_TAG_START.test(value) || hasControlCharacter(value))
}

/**
 * @param value - text typed by the user
 * @param t - translation function
 * @returns the translated error when it contains HTML tags or control characters
 */
export function validateSafeText(value: string | null | undefined, t: TFunction): string | null {
  return hasUnsafeText(value) ? t('validation.unsafeText') : null
}
