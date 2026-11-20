import { apiClient } from './api.ts'
import type { AdminDashboardSummary, TeacherDashboardSummary } from '../types/dashboard.ts'
import i18n from '../i18n/index.ts'

/** Summaries for the admin dashboard (`/api/admin/dashboard`). */
export const dashboardService = {
  /**
   * @param date - day to summarize, `yyyy-MM-dd`
   * @returns the owner's and admins' summary of that day
   */
  async getSummary(date: string): Promise<AdminDashboardSummary> {
    const response = await apiClient.get<AdminDashboardSummary>('/admin/dashboard', { params: { date } })
    return response.data
  },
  /**
   * @returns the summary of the signed-in teacher: their groups, children and pending evaluations
   */
  async getTeacherSummary(): Promise<TeacherDashboardSummary> {
    const response = await apiClient.get<TeacherDashboardSummary>('/admin/dashboard/teacher')
    return response.data
  },
}
