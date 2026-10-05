import { apiClient } from './api.ts'
import { sanitizeFileName } from '../utils/sanitizeFileName.ts'
import type {
    ClubImageResponse,
    ClubRequest,
    ClubResponse,
    PageableParams,
    PageResponse,
} from '../types/clubs.ts'

export interface TranslationItem {
    entityId: string
    fieldName: string
    originalText: string
}

export const clubService = {
    async getAll(params?: PageableParams): Promise<PageResponse<ClubResponse>> {
        const response = await apiClient.get<PageResponse<ClubResponse>>('/clubs', {
            params: {
                lang: params?.lang ?? 'es',
                page: params?.page ?? 0,
                size: params?.size ?? 50,
                sort: params?.sort ?? 'name',
            },
        })
        return response.data
    },

    async getById(id: number, lang = 'es'): Promise<ClubResponse> {
        const response = await apiClient.get<ClubResponse>(`/clubs/${id}`, {
            params: { lang },
        })
        return response.data
    },

    async create(data: ClubRequest): Promise<ClubResponse> {
        const response = await apiClient.post<ClubResponse>('/clubs', data)
        return response.data
    },

    async createWithImages(
        data: ClubRequest,
        coverImage?: File,
        contentImages?: File[],
    ): Promise<ClubResponse> {
        const formData = new FormData()

        if (data.name) formData.append('name', data.name)
        if (data.description) formData.append('description', data.description)
        if (data.schedule) formData.append('schedule', data.schedule)
        if (data.maxCapacity !== undefined && data.maxCapacity !== null) {
            formData.append('maxCapacity', data.maxCapacity.toString())
        }

        if (coverImage) {
            const sanitizedCover = new File([coverImage], sanitizeFileName(coverImage.name), {
                type: coverImage.type,
            })
            formData.append('coverImage', sanitizedCover)
        }

        if (contentImages && contentImages.length > 0) {
            contentImages
                .map((file) => new File([file], sanitizeFileName(file.name), { type: file.type }))
                .forEach((file) => formData.append('contentImages', file))
        }

        const response = await apiClient.post<ClubResponse>('/clubs', formData, {
            headers: { 'Content-Type': undefined },
        })
        return response.data
    },

    async update(id: number, data: ClubRequest): Promise<ClubResponse> {
        const response = await apiClient.put<ClubResponse>(`/clubs/${id}`, data)
        return response.data
    },

    async delete(id: number): Promise<void> {
        await apiClient.delete(`/clubs/${id}`)
    },

    // --- IMÁGENES ---

    async getImagesByClub(clubId: number): Promise<ClubImageResponse[]> {
        const response = await apiClient.get<ClubImageResponse[]>(`/clubs/${clubId}/images`)
        return response.data
    },

    async uploadImages(
        clubId: number,
        files: File[],
        isCover: boolean = false,
    ): Promise<ClubImageResponse[]> {
        const formData = new FormData()
        files
            .map((file) => new File([file], sanitizeFileName(file.name), { type: file.type }))
            .forEach((file) => formData.append('files', file))

        const response = await apiClient.post<ClubImageResponse[]>(
            `/clubs/${clubId}/images`,
            formData,
            {
                params: { isCover },
                headers: { 'Content-Type': undefined },
            },
        )
        return response.data
    },

    async deleteImage(imageId: number): Promise<void> {
        await apiClient.delete(`/clubs/images/${imageId}`)
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