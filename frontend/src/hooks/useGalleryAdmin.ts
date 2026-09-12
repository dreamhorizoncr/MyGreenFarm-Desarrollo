import { useState } from 'react'
import { galleryService } from '../services/gallery.ts'
import { getErrorMessage } from '../utils/error.ts'
import type {
	Gallery,
	GalleryCategory,
	GalleryCategoryRequest,
	GalleryImage,
	GalleryRequest,
} from '../types/gallery.ts'

export function useGalleryAdmin() {
	const [categories, setCategories] = useState<GalleryCategory[]>([])
	const [galleriesByCategory, setGalleriesByCategory] = useState<
		Record<string, Gallery[]>
	>({})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const fetchAll = async () => {
		setLoading(true)
		setError(null)
		try {
			const categoryData = await galleryService.getCategories()

			const entries = await Promise.all(
				categoryData.map(async (category) => {
					const galleries = await galleryService.getByCategory(category.id)
					return [category.id, galleries] as const
				}),
			)

			setCategories(categoryData)
			setGalleriesByCategory(Object.fromEntries(entries))
		} catch (err) {
			setError(getErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	const createCategory = async (dto: GalleryCategoryRequest) => {
		try {
			const created = await galleryService.createCategory(dto)
			setCategories((prev) => [...prev, created])
			setGalleriesByCategory((prev) => ({ ...prev, [created.id]: [] }))
			return created
		} catch (err) {
			setError(getErrorMessage(err))
			throw err
		}
	}

	const updateCategory = async (id: string, dto: GalleryCategoryRequest) => {
		try {
			const updated = await galleryService.updateCategory(id, dto)
			setCategories((prev) => prev.map((category) => (category.id === id ? updated : category)))
			return updated
		} catch (err) {
			setError(getErrorMessage(err))
			throw err
		}
	}

	const deleteCategory = async (id: string) => {
		try {
			await galleryService.deleteCategory(id)
			setCategories((prev) => prev.filter((category) => category.id !== id))
			setGalleriesByCategory((prev) => {
				const next = { ...prev }
				delete next[id]
				return next
			})
		} catch (err) {
			setError(getErrorMessage(err))
			throw err
		}
	}

	const createGallery = async (dto: GalleryRequest) => {
		try {
			const created = await galleryService.createGallery(dto)
			setGalleriesByCategory((prev) => ({
				...prev,
				[dto.categoryId]: [created, ...(prev[dto.categoryId] ?? [])],
			}))
			return created
		} catch (err) {
			setError(getErrorMessage(err))
			throw err
		}
	}

	const updateGallery = async (id: string, dto: GalleryRequest) => {
		try {
			const updated = await galleryService.updateGallery(id, dto)
			setGalleriesByCategory((prev) => {
				const next: Record<string, Gallery[]> = {}

				for (const [categoryId, galleries] of Object.entries(prev)) {
					next[categoryId] = galleries.filter((gallery) => gallery.id !== id)
				}

				next[dto.categoryId] = [...(next[dto.categoryId] ?? []), updated]
				return next
			})
			return updated
		} catch (err) {
			setError(getErrorMessage(err))
			throw err
		}
	}

	const deleteGallery = async (id: string) => {
		try {
			await galleryService.deleteGallery(id)
			setGalleriesByCategory((prev) => {
				const next: Record<string, Gallery[]> = {}
				for (const [categoryId, galleries] of Object.entries(prev)) {
					next[categoryId] = galleries.filter((gallery) => gallery.id !== id)
				}
				return next
			})
		} catch (err) {
			setError(getErrorMessage(err))
			throw err
		}
	}

	const uploadImages = async (galleryId: string, files: File[], title: string) => {
		try {
			const uploaded: GalleryImage[] = await galleryService.uploadImages(galleryId, files, title)
			setGalleriesByCategory((prev) => {
				const next: Record<string, Gallery[]> = {}
				for (const [categoryId, galleries] of Object.entries(prev)) {
					next[categoryId] = galleries.map((gallery) =>
						gallery.id === galleryId
							? { ...gallery, galleryImages: [...gallery.galleryImages, ...uploaded] }
							: gallery,
					)
				}
				return next
			})
			return uploaded
		} catch (err) {
			setError(getErrorMessage(err))
			throw err
		}
	}

	const deleteImage = async (galleryId: string, imageId: string) => {
		try {
			await galleryService.deleteImage(imageId)
			setGalleriesByCategory((prev) => {
				const next: Record<string, Gallery[]> = {}
				for (const [categoryId, galleries] of Object.entries(prev)) {
					next[categoryId] = galleries.map((gallery) =>
						gallery.id === galleryId
							? {
									...gallery,
									galleryImages: gallery.galleryImages.filter(
										(image) => image.id !== imageId,
									),
								}
							: gallery,
					)
				}
				return next
			})
		} catch (err) {
			setError(getErrorMessage(err))
			throw err
		}
	}

	return {
		categories,
		galleriesByCategory,
		loading,
		error,
		fetchAll,
		createCategory,
		updateCategory,
		deleteCategory,
		createGallery,
		updateGallery,
		deleteGallery,
		uploadImages,
		deleteImage,
	}
}