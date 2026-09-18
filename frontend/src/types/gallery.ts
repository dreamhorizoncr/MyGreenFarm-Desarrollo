export interface GalleryImage {
	id: string
	galleryId: string
	title: string
	fileUrl: string
	likeCount?: number
}

export interface Gallery {
	id: string
	title: string
	description: string
	galleryImages: GalleryImage[]
	featured: boolean
}

export interface GalleryCategory {
	id: string
	title: string
}

export interface GalleryRequest {
	categoryId: string
	title: string
	description: string
	featured: boolean
}

export interface GalleryCategoryRequest {
	title: string
}