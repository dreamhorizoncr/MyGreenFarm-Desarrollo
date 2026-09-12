import { useEffect, useState } from 'react'
import { galleryService } from '../services/gallery.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Gallery, GalleryCategory } from '../types/gallery.ts'

export function useGallery() {
	const [categories, setCategories] = useState<GalleryCategory[]>([])
	const [galleriesByCategory, setGalleriesByCategory] = useState<
		Record<string, Gallery[]>
	>({})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchGallery = async () => {
		setLoading(true)
		setError(null)
		try {
			const categoryData = await galleryService.getCategories()
			const sortedCategories = [...categoryData].sort((a, b) =>
				b.title.localeCompare(a.title, undefined, { numeric: true }),
			)

			const entries = await Promise.all(
				sortedCategories.map(async (category) => {
					const galleries = await galleryService.getByCategory(category.id)
					return [category.id, galleries] as const
				}),
			)

			setCategories(sortedCategories)
			setGalleriesByCategory(Object.fromEntries(entries))
		} catch (err) {
			setError(getErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void fetchGallery()
	}, [])

	const allGalleries = Object.values(galleriesByCategory).flat()
	const getGalleriesByCategory = (categoryId: string) =>
		galleriesByCategory[categoryId] ?? []

	return {
		categories,
		galleriesByCategory,
		allGalleries,
		getGalleriesByCategory,
		loading,
		error,
		fetchGallery,
	}
}