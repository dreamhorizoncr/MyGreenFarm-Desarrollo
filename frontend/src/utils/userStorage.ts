import type { UserInfo } from '../types/auth.ts'

const USER_KEY = 'mgf_user'

export const userStorage = {
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
