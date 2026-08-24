// Esto de aquí es para manejar el formulario de restablecer contraseña: guarda si está
// cargando, si hubo error y si salió bien, y llama al servicio para cambiar la contraseña.

import { useState } from 'react'
import i18n from '../i18n/index.ts'
import { authService } from '../services/auth.ts'
import type { ResetPasswordRequest } from '../types/auth.ts'

export function useResetPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submitResetPassword = async (payload: ResetPasswordRequest) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await authService.resetPassword(payload)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : i18n.t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  return { submitResetPassword, loading, error, success }
}
