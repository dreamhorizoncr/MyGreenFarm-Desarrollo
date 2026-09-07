import axios from 'axios'
import i18n from '../i18n/index.ts'

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message

    if (typeof message === 'string') {
      return message
    }

    if (typeof error.response?.data === 'string') {
      return error.response.data
    }
  }

  return error instanceof Error
    ? error.message
    : i18n.t('common.error')
}