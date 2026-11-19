import type { UserInfo } from '../types/auth.ts'

const USER_KEY = 'mgf_user'

/**
 * Data of the signed-in user, kept in `localStorage` to show the menus without asking the backend.
 * The backend checks the permissions again in every request.
 */
export const userStorage = {
  /** @returns the stored user, or `null` when nobody is signed in or the data is corrupt */
  getUser(): UserInfo | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as UserInfo
    } catch {
      return null
    }
  },
  setUser(user: UserInfo): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  },
  clear(): void {
    localStorage.removeItem(USER_KEY)
  },
}
