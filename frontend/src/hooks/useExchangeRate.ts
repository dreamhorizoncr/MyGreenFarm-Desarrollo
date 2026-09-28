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

  useEffect(() => {
    let cancelled = false

    exchangeRateService
      .getCurrent()
      .then((json) => {
        if (!cancelled) {
          setData(json)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getErrorMessage(err))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await exchangeRateService.getCurrent())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, reload }
}
