// Esto de aquí es para manejar el formulario de restablecer contraseña: guarda si está
// cargando, si hubo error y si salió bien, y llama al servicio para cambiar la contraseña.

import { useState } from 'react'
import { authService } from '../services/auth.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ResetPasswordRequest } from '../types/auth.ts'

export function useResetPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submitResetPassword = async (
    payload: ResetPasswordRequest,
    onSuccess?: () => void,
    onError?: (message: string) => void,
  ) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await authService.resetPassword(payload)
      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
      onError?.(message)
    } finally {
      setLoading(false)
    }
  }

  return { submitResetPassword, loading, error, success }
}
