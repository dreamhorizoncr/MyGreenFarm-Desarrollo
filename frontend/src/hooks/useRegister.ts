
import { useState } from 'react'
import { authService } from '../services/auth.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { RegisterData } from '../types/auth.ts'

export function useRegister() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const submitRegister = async (
    payload: RegisterData,
    onSuccess?: () => void,
    onError?: (message: string) => void,
  ) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await authService.register(payload)
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

  return { submitRegister, loading, error, success }
}
