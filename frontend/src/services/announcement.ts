import { apiClient } from './api.ts'
import { sanitizeFileName } from '../utils/sanitizeFileName.ts'
import type {
    Announcement,
    AnnouncementCategory,
    AnnouncementImageResponse,
    AnnouncementRequest,
} from '../types/announcement.ts'

export interface TranslationItem {
    entityId: string
    fieldName: string
    originalText: string
}

export interface AnnouncementPage{
    content: Announcement[]
    totalPages: number
    totalElements: number
    number: number
    size: number
    first: boolean
    last: boolean
}

export const announcementService = {
    async getCategories(): Promise<AnnouncementCategory[]> {
        const response = await apiClient.get<AnnouncementCategory[]>('/announcements/categories')
        return response.data
    },

    async createCategory(title: string): Promise<AnnouncementCategory> {
        const response = await apiClient.post<AnnouncementCategory>('/announcements/categories', { title })
        return response.data
    },

    async deleteCategory(id: string): Promise<void> {
        await apiClient.delete(`/announcements/categories/${id}`)
    },

    // categoryId filtra en el backend, así el paginador cuenta solo las noticias de esa categoría
    async getAnnouncements(lang: string, page: number = 0, size: number = 10, categoryId?: string): Promise<AnnouncementPage> {
        const response = await apiClient.get<AnnouncementPage>('/announcements',{params:{lang,page,size,categoryId}})
        return response.data
    },

    async create(data: AnnouncementRequest): Promise<Announcement> {
        const response = await apiClient.post<Announcement>('/announcements', data)
        return response.data
    },

    async update(id: string, data: AnnouncementRequest): Promise<Announcement> {
        const response = await apiClient.put<Announcement>(`/announcements/${id}`, data)
        return response.data
    },

    async delete(id: string): Promise<void> {
        await apiClient.delete(`/announcements/${id}`)
    },

    async getImages(announcementId: string): Promise<AnnouncementImageResponse[]> {
        const response = await apiClient.get<AnnouncementImageResponse[]>(
            `/announcements/${announcementId}/images`,
        )
        return response.data
    },

    async uploadImages(
        announcementId: string,
        files: File[],
        isCover: boolean,
    ): Promise<AnnouncementImageResponse[]> {
        const formData = new FormData()
        files
            .map((file) => new File([file], sanitizeFileName(file.name), { type: file.type }))
            .forEach((file) => formData.append('files', file))

        const response = await apiClient.post<AnnouncementImageResponse[]>(
            `/announcements/${announcementId}/images`,
            formData,
            {
                params: { isCover },
                headers: { 'Content-Type': undefined },
            },
        )
        return response.data
    },

    async deleteImage(imageId: string): Promise<void> {
        await apiClient.delete(`/announcements/images/${imageId}`)
    },

    async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
        const response = await apiClient.post<Record<string, string>>('/translations/batch', {
            entityType,
            targetLanguage: targetLanguage?.split('-')[0] || 'es',
            items,
        })
        return response.data
    },
}