/** Photo of an album. */
export interface GalleryImage {
	id: string
	galleryId: string
	title: string
	fileUrl: string
	altText?: string | null
	likeCount?: number
}

/** Album of photos. */
export interface Gallery {
	id: string
	title: string
	description: string
	galleryImages: GalleryImage[]
	/** Whether it is shown on the home page. */
	featured: boolean
}

/** Year of the gallery, which groups the albums. */
export interface GalleryCategory {
	id: string
	title: string
}

/** Data to create or update an album. */
export interface GalleryRequest {
	categoryId: string
	title: string
	description: string
	featured: boolean
}

/** Data to create or rename a year. */
export interface GalleryCategoryRequest {
	title: string
}

/** Likes of a photo after liking it or removing the like. */
export interface ImageLikeResponse {
    galleryImagesId: string
    totalLikes: number
    liked: boolean
}