import { apiClient } from './api.ts'
import type { ExchangeRate } from '../types/exchangeRate.ts'

export const exchangeRateService = {
  async getCurrent(): Promise<ExchangeRate | null> {
    const resp = await apiClient.get<ExchangeRate>('/tipo-cambio/actual')
    return resp.status === 204 ? null : resp.data
  },
}
