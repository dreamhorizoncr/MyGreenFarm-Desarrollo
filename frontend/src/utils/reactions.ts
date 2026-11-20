import axios from 'axios'
import i18n from '../i18n/index.ts'
import { getErrorMessage } from './error.ts'
import { notify } from './notifications.ts'
import { tokenStorage } from './token.ts'

/** Explains that the likes are only for visitors without an account. */
function notifyLoggedIn() {
  notify.error({
    title: i18n.t('reactions.errorTitle'),
    description: i18n.t('reactions.loggedIn'),
  })
}

/**
 * Likes are anonymous, so a signed-in user cannot give them.
 *
 * @returns whether the visitor can like; if not, it shows why
 */
export function canReact(): boolean {
  if (!tokenStorage.getToken()) return true
  notifyLoggedIn()
  return false
}

/** @param error - error of a like request */
export function notifyReactionError(error: unknown) {
  if (axios.isAxiosError(error) && error.response?.status === 403) {
    notifyLoggedIn()
    return
  }
  notify.error({ title: i18n.t('reactions.errorTitle'), description: getErrorMessage(error) })
}
