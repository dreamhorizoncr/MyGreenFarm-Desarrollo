import { apiClient } from './api.ts'
import type { AdminDashboardSummary, TeacherDashboardSummary } from '../types/dashboard.ts'
import i18n from '../i18n/index.ts'

export const dashboardService = {
  async getSummary(date: string, language?: string): Promise<AdminDashboardSummary> {
    const lang = (language ?? i18n.resolvedLanguage ?? i18n.language ?? 'es').split('-')[0]
    const response = await apiClient.get<AdminDashboardSummary>('/admin/dashboard', { params: { date, lang } })
    return response.data
  },
  async getTeacherSummary(language?: string): Promise<TeacherDashboardSummary> {
    const lang = (language ?? i18n.resolvedLanguage ?? i18n.language ?? 'es').split('-')[0]
    const response = await apiClient.get<TeacherDashboardSummary>('/admin/dashboard/teacher', { params: { lang } })
    return response.data
  },
}
