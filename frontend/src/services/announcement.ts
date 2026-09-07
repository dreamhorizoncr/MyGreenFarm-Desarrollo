import { apiClient } from './api.ts'
import type {
    Announcement,
    AnnouncementImageResponse,
    AnnouncementRequest,
} from '../types/announcement.ts'

export interface TranslationItem {
    entityId: string
    fieldName: string
    originalText: string
}

export const announcementService = {
    async getAnnouncements(lang: string): Promise<Announcement[]> {
        const response = await apiClient.get<Announcement[]>('/announcements', {params: {lang}})
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
        files.forEach((file) => formData.append('files', file))

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
            targetLanguage,
            items,
        })
        return response.data
    },
}