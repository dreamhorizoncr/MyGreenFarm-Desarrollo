// Esto de aquí es para manejar el formulario de recuperar contraseña: guarda si está
// cargando, si hubo error y si salió bien, y llama al servicio para pedir el correo.

import { useState } from 'react'
import { authService } from '../services/auth.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ForgotPasswordRequest } from '../types/auth.ts'

export function useForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submitForgotPassword = async (payload: ForgotPasswordRequest) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await authService.forgotPassword(payload)
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return { submitForgotPassword, loading, error, success }
}
