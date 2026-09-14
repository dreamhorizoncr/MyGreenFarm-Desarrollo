import { useEffect, useState } from 'react'
import { galleryService } from '../services/gallery.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Gallery, GalleryCategory } from '../types/gallery.ts'

export function useGallery() {
	const [categories, setCategories] = useState<GalleryCategory[]>([])
	const [galleriesByCategory, setGalleriesByCategory] = useState<
		Record<string, Gallery[]>
	>({})
	const [allGalleries, setAllGalleries] = useState<Gallery[]>([])
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

			const [entries, galleries] = await Promise.all([
				Promise.all(
					sortedCategories.map(async (category) => {
						const galleryList = await galleryService.getByCategory(category.id)
						return [category.id, galleryList] as const
					}),
				),
				galleryService.getGalleries(),
			])

			setCategories(sortedCategories)
			setGalleriesByCategory(Object.fromEntries(entries))
			setAllGalleries(galleries)
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