import { useState, useCallback } from 'react'
import { galleryService } from '../services/gallery.ts'
import { getErrorMessage } from '../utils/error'
import type { GalleryImage } from '../types/gallery.ts'

interface ImageLikeState {
    liked: boolean
    totalLikes: number
    loading: boolean
}

export function useImageLikes() {
    const [imageLikes, setImageLikes] = useState<Record<string, ImageLikeState>>({})
    const [error, setError] = useState<string | null>(null)

    const initializeLikes = useCallback((images: GalleryImage[], likedImageIds: string[]) => {
        const likedSet = new Set(likedImageIds)

        setImageLikes((prev) => {
            const next = { ...prev }
            for (const image of images) {
                if (!next[image.id]) {
                    next[image.id] = {
                        liked: likedSet.has(image.id),
                        totalLikes: image.likeCount ?? 0,
                        loading: false,
                    }
                }
            }
            return next
        })
    }, [])

    const toggleReaction = useCallback(async (imageId: string) => {
        setError(null)
        const current = imageLikes[imageId]
        if (!current || current.loading) return
        console.log('current antes del toggle:', current)
        const { liked, totalLikes } = current

        setImageLikes((prev) => ({
            ...prev,
            [imageId]: {
                liked: !liked,
                totalLikes: liked ? totalLikes - 1 : totalLikes + 1,
                loading: true,
            },
        }))

        try {
            const result = await galleryService.galleryImagesLike(imageId)
            setImageLikes((prev) => ({
                ...prev,
                [imageId]: {
                    liked: result.liked,
                    totalLikes: result.totalLikes,
                    loading: false,
                },
            }))
        } catch (err) {
            setImageLikes((prev) => ({
                ...prev,
                [imageId]: { liked, totalLikes, loading: false },
            }))
            setError(getErrorMessage(err))
        }
    }, [imageLikes])

    return { imageLikes, initializeLikes, toggleReaction, error }
}