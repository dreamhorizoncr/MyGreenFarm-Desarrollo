import { apiClient } from './api.ts'
import type { AdminDashboardSummary, TeacherDashboardSummary } from '../types/dashboard.ts'

export const dashboardService = {
  async getSummary(date: string): Promise<AdminDashboardSummary> {
    const response = await apiClient.get<AdminDashboardSummary>('/admin/dashboard', { params: { date } })
    return response.data
  },
  async getTeacherSummary(): Promise<TeacherDashboardSummary> {
    const response = await apiClient.get<TeacherDashboardSummary>('/admin/dashboard/teacher')
    return response.data
  },
}
