import axios, { type AxiosError } from 'axios'
import i18n from '../i18n/index.ts'

const CALENDAR_AVAILABILITY_MESSAGE = 'No se pudo cargar la disponibilidad en este momento'
const MAX_FEATURED_MESSAGE = 'Ya existen 3 galerías destacadas. Debes desmarcar una antes de destacar otra.'

// Handle stable API error codes before generic messages.
function messageFromCode(data: object): string | undefined {
  const code = 'code' in data ? data.code : undefined
  switch (code) {
    case 'SESSION_EXPIRED':
      return i18n.t('common.sessionExpired')
    case 'UNAUTHORIZED':
      return i18n.t('common.unauthorized')
    default:
      return undefined
  }
}

function translateKnownMessage(message: string): string {
  if (message === CALENDAR_AVAILABILITY_MESSAGE) {
    return i18n.t('common.calendarAvailabilityError')
  }
  if (message === MAX_FEATURED_MESSAGE) {
    return i18n.t('admin.gallery.maxFeaturedReached')
  }
  return message
}

function messageFromBody(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null) {
    const fromCode = messageFromCode(data)
    if (fromCode !== undefined) return fromCode

    const message = 'message' in data ? data.message : undefined
    if (typeof message === 'string') return translateKnownMessage(message)
  }

  if (typeof data === 'string') {
    return data === CALENDAR_AVAILABILITY_MESSAGE
      ? i18n.t('common.calendarAvailabilityError')
      : data
  }

  return undefined
}

function isFeaturedGalleryConflict(error: AxiosError): boolean {
  const requestUrl = error.config?.url ?? ''
  const isGalleryUpdate = error.config?.method?.toLowerCase() === 'put' && requestUrl.includes('/gallery/')
  return error.response?.status === 409 && isGalleryUpdate
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return i18n.t('common.timeout')
    }

    const fromBody = messageFromBody(error.response?.data)
    if (fromBody !== undefined) return fromBody

    if (isFeaturedGalleryConflict(error)) {
      return i18n.t('admin.gallery.maxFeaturedReached')
    }
  }

  return error instanceof Error
    ? error.message
    : i18n.t('common.error')
}
