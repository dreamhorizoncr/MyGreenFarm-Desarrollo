import { useCallback, useEffect, useState } from 'react'
import { exchangeRateService } from '../services/exchangeRate.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { ExchangeRate } from '../types/exchangeRate.ts'

/** Result of {@link useExchangeRate}. */
interface UseExchangeRateResult {
  /** Latest exchange rate, or `null` until the first one arrives. */
  data: ExchangeRate | null
  /** True only until the first answer, so later refreshes do not show a skeleton. */
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/** How often the rate is refreshed while the tab is visible. */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000

/**
 * Current exchange rate of the colón, refreshed every five minutes and whenever the tab becomes
 * visible again.
 *
 * @returns the rate, the loading and error state, and a function to reload it now
 */
export function useExchangeRate(): UseExchangeRateResult {
  const [data, setData] = useState<ExchangeRate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => exchangeRateService.getCurrent()
    .then((rate) => {
      setData(rate)
      setError(null)
    })
    .catch((err: unknown) => setError(getErrorMessage(err)))
    .finally(() => setLoading(false)), [])

  useEffect(() => {
    void reload()

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    const interval = window.setInterval(refreshIfVisible, REFRESH_INTERVAL_MS)
    document.addEventListener('visibilitychange', refreshIfVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshIfVisible)
    }
  }, [reload])

  return { data, loading, error, reload }
}
