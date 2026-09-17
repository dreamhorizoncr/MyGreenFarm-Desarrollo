import axios from 'axios'
import i18n from '../i18n/index.ts'

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return i18n.t('common.timeout')
    }

    const message = error.response?.data?.message

    if (typeof message === 'string') {
      if (message === 'No se pudo cargar la disponibilidad en este momento') {
        return i18n.t('common.calendarAvailabilityError')
      }
      return message
    }

    if (typeof error.response?.data === 'string') {
      if (error.response.data === 'No se pudo cargar la disponibilidad en este momento') {
        return i18n.t('common.calendarAvailabilityError')
      }
      return error.response.data
    }
  }

  return error instanceof Error
    ? error.message
    : i18n.t('common.error')
}