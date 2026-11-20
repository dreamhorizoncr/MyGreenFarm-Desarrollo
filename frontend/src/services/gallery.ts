import { apiClient } from './api.ts'
import { withSafeName } from '../utils/sanitizeFileName.ts'
import type {
	Gallery,
	GalleryCategory,
	GalleryCategoryRequest,
	GalleryImage,
	GalleryRequest,
	ImageLikeResponse
} from '../types/gallery.ts'
import { translateBatch } from './translation.ts'

/** Photo gallery: years (categories), albums, images and likes (`/api/gallery`). */
export const galleryService = {
	/** @returns the gallery's years */
	async getCategories(): Promise<GalleryCategory[]> {
		const response = await apiClient.get<GalleryCategory[]>('/gallery/categories')
		return response.data
	},

	/** @returns all the albums */
	async getGalleries(): Promise<Gallery[]> {
		const response = await apiClient.get<{ content: Gallery[] }>('/gallery')
		return response.data.content
	},

	/**
	 * @param limit - most images to return
	 * @returns the images with the most likes
	 */
	async getMostLikedImages(limit = 10): Promise<GalleryImage[]> {
		const response = await apiClient.get<GalleryImage[]>('/gallery/images/most-liked', { params: { limit } })
		return response.data
	},

	/** @returns the albums shown on the home page */
	async getFeatured(): Promise<Gallery[]> {
		const response = await apiClient.get<Gallery[]>('/gallery/featured')
		return response.data
	},

	/**
	 * @param categoryId - year's ID
	 * @returns the albums of that year
	 */
	async getByCategory(categoryId: string): Promise<Gallery[]> {
		const response = await apiClient.get<{ content: Gallery[] }>('/gallery', {
			params: { categoryId },
		})
		return response.data.content
	},

	/**
	 * @param data - the year's title
	 * @returns the created year
	 */
	async createCategory(data: GalleryCategoryRequest): Promise<GalleryCategory> {
		const response = await apiClient.post<GalleryCategory>('/gallery/categories', data)
		return response.data
	},

	/**
	 * @param id - year's ID
	 * @param data - new title
	 * @returns the updated year
	 */
	async updateCategory(id: string, data: GalleryCategoryRequest): Promise<GalleryCategory> {
		const response = await apiClient.put<GalleryCategory>(`/gallery/categories/${id}`, data)
		return response.data
	},

	/** @param id - ID of the year to delete, with its albums */
	async deleteCategory(id: string): Promise<void> {
		await apiClient.delete(`/gallery/categories/${id}`)
	},

	/**
	 * @param data - year, title and description
	 * @returns the created album
	 */
	async createGallery(data: GalleryRequest): Promise<Gallery> {
		const response = await apiClient.post<Gallery>('/gallery', data)
		return response.data
	},

	/**
	 * @param id - album's ID
	 * @param data - new data
	 * @returns the updated album
	 */
	async updateGallery(id: string, data: GalleryRequest): Promise<Gallery> {
		const response = await apiClient.put<Gallery>(`/gallery/${id}`, data)
		return response.data
	},

	/** @param id - ID of the album to delete, with its images */
	async deleteGallery(id: string): Promise<void> {
		await apiClient.delete(`/gallery/${id}`)
	},

	/**
	 * @param galleryId - album's ID
	 * @param files - images to upload
	 * @param title - title of the images
	 * @param altTexts - alternative text of each image, in the same order
	 * @returns the uploaded images
	 */
	async uploadImages(
		galleryId: string,
		files: File[],
		title: string,
		altTexts?: string[],
	): Promise<GalleryImage[]> {
		const formData = new FormData()
		files
			.map((file) => withSafeName(file))
			.forEach((file) => formData.append('files', file))
		if (altTexts?.length) formData.append('altTexts', JSON.stringify(altTexts))

		const response = await apiClient.post<GalleryImage[]>(
			`/gallery/${galleryId}/images`,
			formData,
			{
				params: { title },
				headers: { 'Content-Type': undefined },
				timeout: 120000,
			},
		)
		return response.data
	},

	/** @param imageId - ID of the image to delete */
	async deleteImage(imageId: string): Promise<void> {
		await apiClient.delete(`/gallery/images/${imageId}`)
	},

	/**
	 * @param imageId - image's ID
	 * @param altText - new alternative text
	 */
	async updateImageAlt(imageId: string, altText: string): Promise<void> {
		await apiClient.patch(`/gallery/images/${imageId}/alt`, { altText })
	},
	translateBatch,
	/**
	 * Likes an image, or removes the like if the visitor already gave it. Visitors are told apart by an
	 * anonymous cookie.
	 *
	 * @param imageId - image's ID
	 * @returns whether it is liked now and its total of likes
	 */
	async galleryImagesLike(imageId: string): Promise<ImageLikeResponse> {
		const response = await apiClient.post<ImageLikeResponse>(`/gallery/likes/${imageId}`)
		return response.data
	},

	/** @returns the IDs of the images this visitor likes */
	async getMyLikes(): Promise<string[]> {
		const response = await apiClient.get<string[]>('/gallery/likes/mine')
		return response.data
	},
}
