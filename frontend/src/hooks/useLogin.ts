import { useState } from 'react'
import { authService } from '../services/auth.ts'
import { tokenStorage } from '../utils/token.ts'
import { userStorage } from '../utils/userStorage.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { LoginData, UserInfo } from '../types/auth.ts'

export function useLogin() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)

  const submitLogin = async (payload: LoginData, onSuccess?: (user: UserInfo) => void) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.login(payload)
      tokenStorage.setToken(data.token)
      userStorage.setUser(data.user)
      setUser(data.user)
      onSuccess?.(data.user)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authService.signout()
    } catch {
      // si el backend ya no responde, limpiamos igual
    }
    tokenStorage.clear()
    userStorage.clear()
    setUser(null)
  }

  return { submitLogin, loading, error, user, logout }
}
