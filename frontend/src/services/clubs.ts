import { apiClient } from './api.ts'
import type { PageResponse } from '../types/page.ts'
import { withSafeName } from '../utils/sanitizeFileName.ts'
import type {
    ClubImageResponse,
    ClubRequest,
    ClubResponse,
    PageableParams,
} from '../types/clubs.ts'
import { translateBatch } from './translation.ts'

/** Reduces a language code such as `en-US` to `en`; Spanish when there is none. */
const normalizeLanguageCode = (lang?: string): string => (lang ?? 'es').split('-')[0] || 'es'

/** Clubs and their images (`/api/clubs`). */
export const clubService = {
    /**
     * @param params - page, size, sort and language
     * @returns one page of clubs
     */
    async getAll(params?: PageableParams): Promise<PageResponse<ClubResponse>> {
        const response = await apiClient.get<PageResponse<ClubResponse>>('/clubs', {
            params: {
                lang: normalizeLanguageCode(params?.lang),
                page: params?.page ?? 0,
                size: params?.size ?? 10,
                sort: params?.sort ?? 'name',
            },
        })
        return response.data
    },

    /**
     * @param id - club's ID
     * @param lang - language of the texts
     * @returns the club
     */
    async getById(id: number, lang = 'es'): Promise<ClubResponse> {
        const response = await apiClient.get<ClubResponse>(`/clubs/${id}`, {
            params: { lang: normalizeLanguageCode(lang) },
        })
        return response.data
    },

    /**
     * @param data - the club's data
     * @returns the created club
     */
    async create(data: ClubRequest): Promise<ClubResponse> {
        const response = await apiClient.post<ClubResponse>('/clubs', data)
        return response.data
    },

    /**
     * Creates a club with its cover and gallery in a single request.
     *
     * @param data - the club's data
     * @param coverImage - cover, optional
     * @param contentImages - gallery images, optional
     * @param coverAlt - alternative text of the cover
     * @param contentAlts - alternative text of each gallery image, in the same order
     * @returns the created club
     */
    async createWithImages(
        data: ClubRequest,
        coverImage?: File,
        contentImages?: File[],
        coverAlt?: string,
        contentAlts?: string[],
    ): Promise<ClubResponse> {
        const formData = new FormData()

        if (data.name) formData.append('name', data.name)
        if (data.description) formData.append('description', data.description)
        if (data.schedule) formData.append('schedule', data.schedule)
        if (data.maxCapacity !== undefined && data.maxCapacity !== null) {
            formData.append('maxCapacity', data.maxCapacity.toString())
        }

        if (coverImage) {
            formData.append('coverImage', withSafeName(coverImage))
            if (coverAlt) formData.append('coverAlt', coverAlt)
        }

        if (contentImages && contentImages.length > 0) {
            contentImages
                .map((file) => withSafeName(file))
                .forEach((file) => formData.append('contentImages', file))
            if (contentAlts?.length) formData.append('contentAlts', JSON.stringify(contentAlts))
        }

        const response = await apiClient.post<ClubResponse>('/clubs', formData, {
            headers: { 'Content-Type': undefined },
        })
        return response.data
    },

    /**
     * @param id - club's ID
     * @param data - new data
     * @returns the updated club
     */
    async update(id: number, data: ClubRequest): Promise<ClubResponse> {
        const response = await apiClient.put<ClubResponse>(`/clubs/${id}`, data)
        return response.data
    },

    /** @param id - ID of the club to delete */
    async delete(id: number): Promise<void> {
        await apiClient.delete(`/clubs/${id}`)
    },

    /**
     * @param lang - language of the texts
     * @returns the published clubs with free spots
     */
    async getAvailableClubs(lang: string = "es"): Promise<ClubResponse[]> {
        const response = await apiClient.get<ClubResponse[]>("/clubs/available", {
            params: { lang },
        });
        return response.data;
    },

    /**
     * @param clubId - club's ID
     * @returns its images
     */
    async getImagesByClub(clubId: number): Promise<ClubImageResponse[]> {
        const response = await apiClient.get<ClubImageResponse[]>(`/clubs/${clubId}/images`)
        return response.data
    },

    /**
     * @param clubId - club's ID
     * @param files - images to upload
     * @param isCover - whether they replace the cover
     * @param altTexts - alternative text of each image, in the same order
     * @returns the uploaded images
     */
    async uploadImages(
        clubId: number,
        files: File[],
        isCover: boolean = false,
        altTexts?: string[],
    ): Promise<ClubImageResponse[]> {
        const formData = new FormData()
        files
            .map((file) => withSafeName(file))
            .forEach((file) => formData.append('files', file))
        if (altTexts?.length) formData.append('altTexts', JSON.stringify(altTexts))

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

    /** @param imageId - ID of the image to delete */
    async deleteImage(imageId: number): Promise<void> {
        await apiClient.delete(`/clubs/images/${imageId}`)
    },

    /**
     * @param imageId - image's ID
     * @param altText - new alternative text
     */
    async updateImageAlt(imageId: number, altText: string): Promise<void> {
        await apiClient.patch(`/clubs/images/${imageId}/alt`, { altText })
    },

    translateBatch,
}
