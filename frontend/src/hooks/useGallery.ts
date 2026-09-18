import { useState } from 'react'
import { galleryService } from '../services/gallery.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Gallery, GalleryCategory, GalleryImage } from '../types/gallery.ts'

const SOURCE_LANG = 'es'

export function useGallery() {
	const [categories, setCategories] = useState<GalleryCategory[]>([])
	const [galleriesByCategory, setGalleriesByCategory] = useState<
		Record<string, Gallery[]>
	>({})
	const [allGalleries, setAllGalleries] = useState<Gallery[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchGallery = async (lang: string) => {
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

			let translatedCategories = sortedCategories
			let translatedGalleries = galleries
			let translatedEntries = entries

			if (lang !== SOURCE_LANG) {
				const uniqueImages = new Map<string, GalleryImage>()
				const uniqueGalleries = new Map<string, Gallery>()
				const collect = (galleryList: Gallery[]) => {
					for (const gallery of galleryList) {
						uniqueGalleries.set(gallery.id, gallery)
						for (const image of gallery.galleryImages) {
							uniqueImages.set(image.id, image)
						}
					}
				}
				collect(galleries)
				entries.forEach(([, galleryList]) => collect(galleryList))

				const [categoryT, galleryT, imageT] = await Promise.all([
					galleryService.translateBatch(
						'gallery_category',
						lang,
						sortedCategories.map((category) => ({
							entityId: category.id,
							fieldName: 'title',
							originalText: category.title,
						})),
					),
					galleryService.translateBatch(
						'gallery',
						lang,
						Array.from(uniqueGalleries.values(), (g) => [
							{ entityId: g.id, fieldName: 'title', originalText: g.title },
							{ entityId: g.id, fieldName: 'description', originalText: g.description },
						]).flat(),
					),
					galleryService.translateBatch(
						'gallery_image',
						lang,
						Array.from(uniqueImages.values(), (img) => ({
							entityId: img.id,
							fieldName: 'title',
							originalText: img.title,
						})),
					),
				])

				const translated = { ...categoryT, ...galleryT, ...imageT }

				const translateGallery = (gallery: Gallery): Gallery => ({
					...gallery,
					title: translated[`${gallery.id}:title`] ?? gallery.title,
					description: translated[`${gallery.id}:description`] ?? gallery.description,
					galleryImages: gallery.galleryImages.map((image) => ({
						...image,
						title: translated[`${image.id}:title`] ?? image.title,
					})),
				})

				translatedCategories = sortedCategories.map((category) => ({
					...category,
					title: translated[`${category.id}:title`] ?? category.title,
				}))
				translatedGalleries = galleries.map(translateGallery)
				translatedEntries = entries.map(([categoryId, galleryList]) => [
					categoryId,
					galleryList.map(translateGallery),
				] as const)
			}

			setCategories(translatedCategories)
			setGalleriesByCategory(Object.fromEntries(translatedEntries))
			setAllGalleries(translatedGalleries)
		} catch (err) {
			setError(getErrorMessage(err))
		} finally {
			setLoading(false)
		}
	}

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