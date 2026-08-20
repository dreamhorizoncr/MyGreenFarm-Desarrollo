import type { TFunction } from 'i18next'

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
