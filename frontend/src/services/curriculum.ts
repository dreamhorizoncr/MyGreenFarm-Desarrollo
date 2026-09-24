import type { ApplicationInput, Curriculum, CurriculumStatus } from '../types/curriculum.ts'
import { sanitizeFileName } from '../utils/sanitizeFileName.ts'
import { apiClient } from './api.ts'
import type { TranslationItem } from './announcement.ts'

export const curriculumService = {
  async getCurriculums(): Promise<Curriculum[]> {
    const response = await apiClient.get<Curriculum[]>('/applications')
    return response.data
  },

  async submitApplication(data: ApplicationInput): Promise<Curriculum> {
    const formData = new FormData()
    formData.append('data', JSON.stringify({
      vacancyId: data.vacancyId,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      applicantPhone: data.applicantPhone,
    }))

    if (data.file) {
      formData.append('file', new File([data.file], sanitizeFileName(data.file.name), { type: data.file.type }))
    }

    data.certificates
      .map((certificate) => new File([certificate], sanitizeFileName(certificate.name), { type: certificate.type }))
      .forEach((certificate) => formData.append('certificates', certificate))

    const response = await apiClient.post<Curriculum>('/applications', formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  async setCurriculumStatus(id: string, status: CurriculumStatus): Promise<Curriculum> {
    const response = await apiClient.patch<Curriculum>(`/applications/${id}/status`, null, { params: { status } })
    return response.data
  },

  async deleteCurriculum(id: string): Promise<void> {
    await apiClient.delete(`/applications/${id}`)
  },

  async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
    const response = await apiClient.post<Record<string, string>>('/translations/batch', {
      entityType,
      targetLanguage,
      items,
    })
    return response.data
  },
}
