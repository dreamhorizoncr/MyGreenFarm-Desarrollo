import axios, { type AxiosError } from 'axios'
import i18n from '../i18n/index.ts'

const CALENDAR_AVAILABILITY_MESSAGE = 'No se pudo cargar la disponibilidad en este momento'
const MAX_FEATURED_MESSAGE = 'Ya existen 3 galerías destacadas. Debes desmarcar una antes de destacar otra.'

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
  if (message === 'Este correo ya se encuentra suscrito activamente al boletín.') {
    return i18n.t('home.join.emailAlreadySubscribed')
  }
  if (message === 'El correo electrónico es obligatorio.') {
    return i18n.t('home.join.emailRequired')
  }
  if (message === 'El formato del correo electrónico no es válido.') {
    return i18n.t('home.join.emailInvalid')
  }
  if (message === 'El dominio del correo no es válido.') {
    return i18n.t('home.join.domainInvalid')
  }
  if (message.startsWith('Solo se permiten correos de proveedores comunes')) {
    return i18n.t('home.join.emailProviderNotAllowed')
  }
  return message
}

function bodyText(data: object): unknown {
  if ('message' in data) return data.message
  return 'error' in data ? data.error : undefined
}

function messageFromBody(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null) {
    const fromCode = messageFromCode(data)
    if (fromCode !== undefined) return fromCode

    const message = bodyText(data)
    if (typeof message === 'string') return translateKnownMessage(message)
  }

  if (typeof data === 'string') {
    return translateKnownMessage(data)
  }

  return undefined
}

function isFeaturedGalleryConflict(error: AxiosError): boolean {
  const requestUrl = error.config?.url ?? ''
  const isGalleryUpdate = error.config?.method?.toLowerCase() === 'put' && requestUrl.includes('/gallery/')
  return error.response?.status === 409 && isGalleryUpdate
}

const STATUS_MESSAGE_KEYS = {
  401: 'common.sessionExpired',
  403: 'common.errors.forbidden',
  404: 'common.errors.notFound',
  409: 'common.errors.conflict',
  413: 'common.errors.fileTooLarge',
} as const

function messageFromStatus(status: number): string {
  const known = STATUS_MESSAGE_KEYS[status as keyof typeof STATUS_MESSAGE_KEYS]
  if (known) return i18n.t(known)
  return status >= 500 ? i18n.t('common.errors.server') : i18n.t('common.errors.invalidData')
}

function axiosErrorMessage(error: AxiosError): string {
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return i18n.t('common.timeout')
  }

  const fromBody = messageFromBody(error.response?.data)
  if (fromBody !== undefined) return fromBody

  if (isFeaturedGalleryConflict(error)) {
    return i18n.t('admin.gallery.maxFeaturedReached')
  }

  if (!error.response) return i18n.t('common.errors.network')
  return messageFromStatus(error.response.status)
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) return axiosErrorMessage(error)

  return error instanceof Error && error.message
    ? error.message
    : i18n.t('common.error')
}
