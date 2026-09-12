import { apiClient } from './api.ts'
import type {
	Gallery,
	GalleryCategory,
	GalleryCategoryRequest,
	GalleryImage,
	GalleryRequest,
} from '../types/gallery.ts'

export const galleryService = {
	async getCategories(): Promise<GalleryCategory[]> {
		const response = await apiClient.get<GalleryCategory[]>('/gallery/categories')
		return response.data
	},

	async getGalleries(): Promise<Gallery[]> {
		const response = await apiClient.get<Gallery[]>('/gallery')
		return response.data
	},

	async getByCategory(categoryId: string): Promise<Gallery[]> {
		const response = await apiClient.get<Gallery[]>('/gallery', {
			params: { categoryId },
		})
		return response.data
	},

	async createCategory(data: GalleryCategoryRequest): Promise<GalleryCategory> {
		const response = await apiClient.post<GalleryCategory>('/gallery/categories', data)
		return response.data
	},

	async updateCategory(id: string, data: GalleryCategoryRequest): Promise<GalleryCategory> {
		const response = await apiClient.put<GalleryCategory>(`/gallery/categories/${id}`, data)
		return response.data
	},

	async deleteCategory(id: string): Promise<void> {
		await apiClient.delete(`/gallery/categories/${id}`)
	},

	async createGallery(data: GalleryRequest): Promise<Gallery> {
		const response = await apiClient.post<Gallery>('/gallery', data)
		return response.data
	},

	async updateGallery(id: string, data: GalleryRequest): Promise<Gallery> {
		const response = await apiClient.put<Gallery>(`/gallery/${id}`, data)
		return response.data
	},

	async deleteGallery(id: string): Promise<void> {
		await apiClient.delete(`/gallery/${id}`)
	},

	async uploadImages(
		galleryId: string,
		files: File[],
		title: string,
	): Promise<GalleryImage[]> {
		const formData = new FormData()
		files.forEach((file) => formData.append('files', file))

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

	async deleteImage(imageId: string): Promise<void> {
		await apiClient.delete(`/gallery/images/${imageId}`)
	},
}