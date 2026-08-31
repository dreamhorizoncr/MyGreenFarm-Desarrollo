// Esto de aquí es para manejar el formulario de registro: guarda si está cargando,
// si hubo error y si salió bien, y llama al servicio para registrar al usuario.

import { useState } from 'react'
import { authService } from '../services/auth.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { RegisterData } from '../types/auth.ts'

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submitRegister = async (payload: RegisterData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await authService.register(payload)
      setSuccess(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return { submitRegister, loading, error, success }
}
