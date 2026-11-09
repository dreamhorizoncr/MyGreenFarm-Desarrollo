import { apiClient } from './api.ts'
import { seedSkeletonCounts } from '../hooks/useSkeletonCount.ts'

export function preloadListCounts() {
  apiClient
    .get<Record<string, number>>('/public/list-counts', { timeout: 8000 })
    .then((response) => seedSkeletonCounts(response.data))
    .catch(() => undefined)
}
