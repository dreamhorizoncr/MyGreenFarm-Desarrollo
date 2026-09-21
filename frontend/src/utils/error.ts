import axios from 'axios'
import i18n from '../i18n/index.ts'

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return i18n.t('common.timeout')
    }

    const data: unknown = error.response?.data

    // Handle stable API error codes before generic messages.
    if (typeof data === 'object' && data !== null) {
      const code = 'code' in data ? data.code : undefined
      switch (code) {
        case 'SESSION_EXPIRED':
          return i18n.t('common.sessionExpired')
        case 'UNAUTHORIZED':
          return i18n.t('common.unauthorized')
      }
    }

    const message =
      typeof data === 'object' && data !== null && 'message' in data
        ? data.message
        : undefined

    if (typeof message === 'string') {
      if (message === 'No se pudo cargar la disponibilidad en este momento') {
        return i18n.t('common.calendarAvailabilityError')
      }
      if (message === 'Ya existen 3 galerías destacadas. Debes desmarcar una antes de destacar otra.') {
        return i18n.t('admin.gallery.maxFeaturedReached')
      }
      return message
    }

    if (typeof data === 'string') {
      if (data === 'No se pudo cargar la disponibilidad en este momento') {
        return i18n.t('common.calendarAvailabilityError')
      }
      return data
    }

    const requestUrl = error.config?.url ?? ''
    const isGalleryUpdate = error.config?.method?.toLowerCase() === 'put' && requestUrl.includes('/gallery/')

    if (error.response?.status === 409 && isGalleryUpdate) {
      return i18n.t('admin.gallery.maxFeaturedReached')
    }
  }

  return error instanceof Error
    ? error.message
    : i18n.t('common.error')
}