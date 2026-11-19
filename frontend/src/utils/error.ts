import axios, { type AxiosError } from 'axios'
import i18n from '../i18n/index.ts'

/** @returns the translated message of the error codes the backend uses for the session */
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

/** @returns the `message`, or the `error` of an error that is not Spring's default one */
function bodyText(data: object): unknown {
  if ('message' in data && data.message) return data.message
  const isSpringDefaultError = 'status' in data && 'path' in data
  return 'error' in data && !isSpringDefaultError ? data.error : undefined
}

/** @returns the message the backend sent in the error body, if any */
function messageFromBody(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null) {
    const fromCode = messageFromCode(data)
    if (fromCode !== undefined) return fromCode

    const message = bodyText(data)
    if (typeof message === 'string') return message
  }

  if (typeof data === 'string') {
    return data
  }

  return undefined
}

/**
 * @param error - error thrown by a request
 * @returns the name of the field the backend rejected, so the form can highlight it
 */
export function getErrorField(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined
  const data: unknown = error.response?.data
  if (typeof data !== 'object' || data === null || !('field' in data)) return undefined
  return typeof data.field === 'string' ? data.field : undefined
}

/** @returns whether the error is the 409 for having already featured the most albums allowed */
function isFeaturedGalleryConflict(error: AxiosError): boolean {
  const requestUrl = error.config?.url ?? ''
  const isGalleryUpdate = error.config?.method?.toLowerCase() === 'put' && requestUrl.includes('/gallery/')
  return error.response?.status === 409 && isGalleryUpdate
}

/** Translation key of the message for each HTTP status without a message of its own. */
const STATUS_MESSAGE_KEYS = {
  401: 'common.sessionExpired',
  403: 'common.errors.forbidden',
  404: 'common.errors.notFound',
  409: 'common.errors.conflict',
  413: 'common.errors.fileTooLarge',
} as const

/** @returns the translated message for an HTTP status */
function messageFromStatus(status: number): string {
  const known = STATUS_MESSAGE_KEYS[status as keyof typeof STATUS_MESSAGE_KEYS]
  if (known) return i18n.t(known)
  return status >= 500 ? i18n.t('common.errors.server') : i18n.t('common.errors.invalidData')
}

/** @returns the message of a failed request: timeout, the backend's message, or one by status */
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

/**
 * Turns any error into a message to show to the user, in the current language.
 *
 * @param error - error thrown by a request or by the code
 * @returns the backend's message when it sent one; otherwise a translated message for the kind of
 *   error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) return axiosErrorMessage(error)

  return error instanceof Error && error.message
    ? error.message
    : i18n.t('common.error')
}
