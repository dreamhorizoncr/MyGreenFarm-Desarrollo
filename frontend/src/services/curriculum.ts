import type { ApplicationInput, Curriculum, CurriculumStatus } from '../types/curriculum.ts'
import { SEED_CURRICULUMS } from '../data/curriculums.seed.ts'
import { createMockStore } from '../utils/mockStore.ts'
import { fileToDataUrl } from '../utils/file.ts'
import { apiClient } from './api.ts'
import type { TranslationItem } from './announcement.ts'

// No existe endpoint real todavía. Cuando lo haya, el envío del PDF se
// hace con FormData, igual que uploadImages en services/announcement.ts,
// y ya no hace falta fileToDataUrl ni createMockStore/SEED_CURRICULUMS:
//
// import { apiClient } from './api.ts'
//
// async getCurriculums(): Promise<Curriculum[]> {
//   const response = await apiClient.get<Curriculum[]>('/applications')
//   return response.data
// }
//
// async submitApplication(data: ApplicationInput): Promise<Curriculum> {
//   const formData = new FormData()
//   formData.append('vacancyId', data.vacancyId)
//   formData.append('applicantName', data.applicantName)
//   formData.append('applicantEmail', data.applicantEmail)
//   formData.append('applicantPhone', data.applicantPhone)
//   formData.append('file', data.file)
//
//   const response = await apiClient.post<Curriculum>('/applications', formData, {
//     headers: { 'Content-Type': undefined },
//   })
//   return response.data
// }
//
// async setCurriculumStatus(id: string, status: CurriculumStatus): Promise<Curriculum> {
//   const response = await apiClient.patch<Curriculum>(`/applications/${id}/status`, null, { params: { status } })
//   return response.data
// }
//
// async deleteCurriculum(id: string): Promise<void> {
//   await apiClient.delete(`/applications/${id}`)
// }
const store = createMockStore<Curriculum>('mgf_mock_applications_v6', SEED_CURRICULUMS)

let mockCurriculums: Curriculum[] = store.load()

const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

export const curriculumService = {
  async getCurriculums(): Promise<Curriculum[]> {
    await delay()
    return mockCurriculums.slice()
  },

  async submitApplication(data: ApplicationInput): Promise<Curriculum> {
    const fileUrl = data.file ? await fileToDataUrl(data.file) : null
    const certificateUrls = await Promise.all(data.certificates.map((certificate) => fileToDataUrl(certificate)))
    await delay(600)

    const curriculum: Curriculum = {
      id: crypto.randomUUID(),
      vacancyId: data.vacancyId,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      applicantPhone: data.applicantPhone,
      fileName: data.file?.name ?? null,
      fileUrl,
      certificates: data.certificates.map((certificate, index) => ({
        id: crypto.randomUUID(),
        fileName: certificate.name,
        fileUrl: certificateUrls[index],
      })),
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
    }

    mockCurriculums.unshift(curriculum)
    store.save(mockCurriculums)
    return curriculum
  },

  async setCurriculumStatus(id: string, status: CurriculumStatus): Promise<Curriculum> {
    await delay(300)
    const target = mockCurriculums.find((c) => c.id === id)
    if (!target) throw new Error('Curriculum not found')

    target.status = status
    store.save(mockCurriculums)
    return target
  },

  async deleteCurriculum(id: string): Promise<void> {
    await delay()
    mockCurriculums = mockCurriculums.filter((c) => c.id !== id)
    store.save(mockCurriculums)
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
