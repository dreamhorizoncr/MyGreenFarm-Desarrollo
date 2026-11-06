import type { TFunction } from 'i18next'
import { isValidPhoneNumber } from 'react-phone-number-input'

// Separado de validators.ts para que la librería de teléfonos (pesada) solo se descargue en los formularios que la usan.
export function validatePhoneNumber(value: string, t: TFunction): string | null {
  if (!value.trim()) return null
  if (!isValidPhoneNumber(value)) return t('validation.phoneInvalid')
  return null
}
