
import { useState } from 'react'
import { authService } from '../services/auth.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ForgotPasswordRequest } from '../types/auth.ts'

export function useForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submitForgotPassword = async (
    payload: ForgotPasswordRequest,
    onSuccess?: () => void,
    onError?: (message: string) => void,
  ) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await authService.forgotPassword(payload)
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

  return { submitForgotPassword, loading, error, success }
}
