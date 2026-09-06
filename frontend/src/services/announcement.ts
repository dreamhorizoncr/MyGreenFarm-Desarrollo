import { apiClient } from './api.ts'
import type { Announcement } from '../types/announcement.ts'

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

    async translateBatch(entityType: string, targetLanguage: string, items: TranslationItem[]): Promise<Record<string, string>> {
        const response = await apiClient.post<Record<string, string>>('/translations/batch', {
            entityType,
            targetLanguage,
            items,
        })
        return response.data
    },
}