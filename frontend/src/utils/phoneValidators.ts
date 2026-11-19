import type { TFunction } from 'i18next'
import { isValidPhoneNumber } from 'react-phone-number-input'

/**
 * @param value - phone number in E.164 format, as the phone input gives it
 * @param t - translation function
 * @returns the translated error, or `null` when it is valid or empty (the field is optional)
 */
export function validatePhoneNumber(value: string, t: TFunction): string | null {
  if (!value.trim()) return null
  if (!isValidPhoneNumber(value)) return t('validation.phoneInvalid')
  return null
}
