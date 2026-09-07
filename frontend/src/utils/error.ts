import axios from 'axios'
import i18n from '../i18n/index.ts'

export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : i18n.t('common.error')
}

export function getApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string }
      | string
      | undefined
    if (typeof data === 'string' && data) return data
    if (data && typeof data === 'object' && data.message) return data.message
  }
  return getErrorMessage(err)
}