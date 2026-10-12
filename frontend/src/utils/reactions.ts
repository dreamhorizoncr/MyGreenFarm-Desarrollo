import axios from 'axios'
import i18n from '../i18n/index.ts'
import { getErrorMessage } from './error.ts'
import { notify } from './notifications.ts'
import { tokenStorage } from './token.ts'

// Las reacciones (me gusta del foro y de la galería) son solo para visitantes: el backend
// responde 403 si la petición viene con sesión iniciada.
function notifyLoggedIn() {
  notify.error({
    title: i18n.t('reactions.errorTitle'),
    description: i18n.t('reactions.loggedIn'),
  })
}

// Devuelve false (y avisa la razón) si hay sesión iniciada, para no intentar la petición.
export function canReact(): boolean {
  if (!tokenStorage.getToken()) return true
  notifyLoggedIn()
  return false
}

// Muestra el error de una reacción como notificación, con la razón cuando es por la sesión.
export function notifyReactionError(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    notifyLoggedIn()
    return
  }
  notify.error({ title: i18n.t('reactions.errorTitle'), description: getErrorMessage(error) })
}
