import type { ApplicationInput, Curriculum, CurriculumStatus } from '../types/curriculum.ts'
import { withSafeName } from '../utils/sanitizeFileName.ts'
import { apiClient } from './api.ts'
import { translateBatch } from './translation.ts'

/** Job applications and their CVs (`/api/applications`). */
export const curriculumService = {
  /** @returns all the applications, newest first */
  async getCurriculums(): Promise<Curriculum[]> {
    const response = await apiClient.get<Curriculum[]>('/applications')
    return response.data
  },

  /**
   * Sends an application with its CV and certificates. The file names are sanitized first.
   *
   * @param data - applicant's data, the vacancy and the files
   * @returns the created application
   */
  async submitApplication(data: ApplicationInput): Promise<Curriculum> {
    const formData = new FormData()
    formData.append('data', JSON.stringify({
      vacancyId: data.vacancyId,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      applicantPhone: data.applicantPhone,
      language: data.language,
    }))

    if (data.file) {
      formData.append('file', withSafeName(data.file))
    }

    data.certificates
      .map((certificate) => withSafeName(certificate))
      .forEach((certificate) => formData.append('certificates', certificate))

    const response = await apiClient.post<Curriculum>('/applications', formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  /**
   * Accepts or rejects an application and emails the applicant.
   *
   * @param id - application's ID
   * @param status - new status
   * @param lang - language of the email
   * @param vacancyId - vacancy the applicant is accepted for, if any
   * @returns the updated application
   */
  async setCurriculumStatus(id: string, status: CurriculumStatus, lang = 'es', vacancyId?: string): Promise<Curriculum> {
    const response = await apiClient.patch<Curriculum>(`/applications/${id}/status`, null, { params: { status, lang, vacancyId } })
    return response.data
  },

  /** @param id - ID of the application to delete, with its files */
  async deleteCurriculum(id: string): Promise<void> {
    await apiClient.delete(`/applications/${id}`)
  },

  translateBatch,
}
