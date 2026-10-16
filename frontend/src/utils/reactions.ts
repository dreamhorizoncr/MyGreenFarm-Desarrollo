import axios from 'axios'
import i18n from '../i18n/index.ts'
import { getErrorMessage } from './error.ts'
import { notify } from './notifications.ts'
import { tokenStorage } from './token.ts'

function notifyLoggedIn() {
  notify.error({
    title: i18n.t('reactions.errorTitle'),
    description: i18n.t('reactions.loggedIn'),
  })
}

export function canReact(): boolean {
  if (!tokenStorage.getToken()) return true
  notifyLoggedIn()
  return false
}

export function notifyReactionError(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    notifyLoggedIn()
    return
  }
  notify.error({ title: i18n.t('reactions.errorTitle'), description: getErrorMessage(error) })
}
