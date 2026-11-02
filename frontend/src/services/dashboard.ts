import { apiClient } from './api.ts'
import type { AdminDashboardSummary } from '../types/dashboard.ts'

export const dashboardService = {
  async getSummary(date: string, period: 'today' | 'thisWeek' | 'thisMonth'): Promise<AdminDashboardSummary> {
    const response = await apiClient.get<AdminDashboardSummary>('/admin/dashboard', {
      params: { date, period },
    })
    return response.data
  },
}
