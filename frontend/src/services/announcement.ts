import { apiClient } from './api.ts'
import type { PageResponse } from '../types/page.ts'
import { withSafeName } from '../utils/sanitizeFileName.ts'
import type {
    Announcement,
    AnnouncementCategory,
    AnnouncementImageResponse,
    AnnouncementRequest,
} from '../types/announcement.ts'
import { translateBatch } from './translation.ts'

/** A page of announcements. */
export type AnnouncementPage = PageResponse<Announcement>

/** News announcements, their categories and images (`/api/announcements`). */
export const announcementService = {
    /** @returns the announcement categories */
    async getCategories(): Promise<AnnouncementCategory[]> {
        const response = await apiClient.get<AnnouncementCategory[]>('/announcements/categories')
        return response.data
    },

    /**
     * @param title - category's name
     * @returns the created category
     */
    async createCategory(title: string): Promise<AnnouncementCategory> {
        const response = await apiClient.post<AnnouncementCategory>('/announcements/categories', { title })
        return response.data
    },

    /** @param id - ID of the category to delete */
    async deleteCategory(id: string): Promise<void> {
        await apiClient.delete(`/announcements/categories/${id}`)
    },

    /**
     * @param lang - language of the texts
     * @param page - page number, starting at 0
     * @param size - announcements per page
     * @param categoryId - category to filter by, optional
     * @returns one page of announcements, newest first
     */
    async getAnnouncements(lang: string, page: number = 0, size: number = 10, categoryId?: string): Promise<AnnouncementPage> {
        const response = await apiClient.get<AnnouncementPage>('/announcements', { params: { lang, page, size, categoryId } })
        return response.data
    },

    /**
     * @param data - title, content and category
     * @returns the created announcement, with its AI summary
     */
    async create(data: AnnouncementRequest): Promise<Announcement> {
        const response = await apiClient.post<Announcement>('/announcements', data)
        return response.data
    },

    /**
     * @param id - announcement's ID
     * @param data - new data
     * @returns the updated announcement
     */
    async update(id: string, data: AnnouncementRequest): Promise<Announcement> {
        const response = await apiClient.put<Announcement>(`/announcements/${id}`, data)
        return response.data
    },

    /** @param id - ID of the announcement to delete, with its images */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`/announcements/${id}`)
    },

    /**
     * @param announcementId - announcement's ID
     * @returns its images
     */
    async getImages(announcementId: string): Promise<AnnouncementImageResponse[]> {
        const response = await apiClient.get<AnnouncementImageResponse[]>(
            `/announcements/${announcementId}/images`,
        )
        return response.data
    },

    /**
     * @param announcementId - announcement's ID
     * @param files - images to upload
     * @param isCover - whether they are the cover
     * @param altTexts - alternative text of each image, in the same order
     * @returns the uploaded images
     */
    async uploadImages(
        announcementId: string,
        files: File[],
        isCover: boolean,
        altTexts?: string[],
    ): Promise<AnnouncementImageResponse[]> {
        const formData = new FormData()
        files
            .map((file) => withSafeName(file))
            .forEach((file) => formData.append('files', file))
        if (altTexts?.length) formData.append('altTexts', JSON.stringify(altTexts))

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

    /** @param imageId - ID of the image to delete */
    async deleteImage(imageId: string): Promise<void> {
        await apiClient.delete(`/announcements/images/${imageId}`)
    },

    /**
     * @param imageId - image's ID
     * @param altText - new alternative text
     */
    async updateImageAlt(imageId: string, altText: string): Promise<void> {
        await apiClient.patch(`/announcements/images/${imageId}/alt`, { altText })
    },

    translateBatch,
}