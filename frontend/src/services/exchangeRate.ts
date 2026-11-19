import { apiClient } from './api.ts'
import type { ExchangeRate } from '../types/exchangeRate.ts'

/** Exchange rate of the colón (`/api/exchange-rate`). */
export const exchangeRateService = {
  /** @returns the latest rate, or `null` while the backend has not fetched any yet */
  async getCurrent(): Promise<ExchangeRate | null> {
    const resp = await apiClient.get<ExchangeRate>('/exchange-rate/current')
    return resp.status === 204 ? null : resp.data
  },
}
