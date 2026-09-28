import { useCallback, useEffect, useState } from 'react'
import { exchangeRateService } from '../services/exchangeRate.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ExchangeRate } from '../types/exchangeRate.ts'

interface UseExchangeRateResult {
  data: ExchangeRate | null
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

export function useExchangeRate(): UseExchangeRateResult {
  const [data, setData] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    try {
      setData(await exchangeRateService.getCurrent())
      setError(null)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()

    // Mantiene la tasa sincronizada con las actualizaciones periódicas del backend.
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reload()
    }, 5 * 60 * 1000)

    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    document.addEventListener('visibilitychange', refreshOnFocus)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshOnFocus)
    }
  }, [reload])

  return { data, loading, error, reload }
}
