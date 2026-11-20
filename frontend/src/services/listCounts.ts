import { apiClient } from './api.ts'
import { seedSkeletonCounts } from '../hooks/useSkeletonCount.ts'

/**
 * Fetches how many items each public list has, so their skeletons show the right number of
 * placeholders from the first render. A failure is ignored: the skeletons then use their defaults.
 */
export function preloadListCounts() {
  apiClient
    .get<Record<string, number>>('/public/list-counts', { timeout: 8000 })
    .then((response) => seedSkeletonCounts(response.data))
    .catch(() => undefined)
}
