import { useCallback, useState } from 'react'
import type { TFunction } from 'i18next'
import { validateSafeText } from '../utils/validators.ts'

export const IMAGE_ALT_MAX_LENGTH = 140

interface ImageWithAlt {
  id: string | number
  altText?: string | null
}

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`

export function useImageAlts() {
  const [newAlts, setNewAlts] = useState<Record<string, string>>({})
  const [editedAlts, setEditedAlts] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string | null>>({})

  const reset = useCallback(() => {
    setNewAlts({})
    setEditedAlts({})
    setErrors({})
  }, [])

  const clearError = (key: string) =>
    setErrors((current) => (current[key] ? { ...current, [key]: null } : current))

  const newValue = (file: File) => newAlts[fileKey(file)] ?? ''
  const setNewValue = (file: File, value: string) => {
    const key = fileKey(file)
    setNewAlts((current) => ({ ...current, [key]: value }))
    clearError(`new:${key}`)
  }
  const newError = (file: File) => errors[`new:${fileKey(file)}`] ?? null

  const existingValue = (image: ImageWithAlt) => editedAlts[String(image.id)] ?? image.altText ?? ''
  const setExistingValue = (id: string | number, value: string) => {
    setEditedAlts((current) => ({ ...current, [String(id)]: value }))
    clearError(`old:${id}`)
  }
  const existingError = (id: string | number) => errors[`old:${id}`] ?? null

  const validate = (files: File[], images: ImageWithAlt[], t: TFunction) => {
    const next: Record<string, string | null> = {}
    for (const file of files) {
      const value = newValue(file).trim()
      next[`new:${fileKey(file)}`] = value ? validateSafeText(value, t) : t('common.imageAltRequired')
    }
    for (const image of images) {
      const value = existingValue(image).trim()
      next[`old:${image.id}`] = value ? validateSafeText(value, t) : null
    }
    setErrors(next)
    return Object.values(next).every((message) => !message)
  }

  const altsFor = (files: File[]) => files.map((file) => newValue(file).trim())

  const changed = (images: ImageWithAlt[]) =>
    images
      .filter((image) => String(image.id) in editedAlts && existingValue(image).trim() !== (image.altText ?? '').trim())
      .map((image) => ({ id: image.id, altText: existingValue(image).trim() }))

  return { reset, newValue, setNewValue, newError, existingValue, setExistingValue, existingError, validate, altsFor, changed }
}
