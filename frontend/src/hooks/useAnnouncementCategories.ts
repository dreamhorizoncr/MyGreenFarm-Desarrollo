import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { announcementService } from '../services/announcement.ts'
import type { AnnouncementCategory } from '../types/announcement.ts'

const CODE_LABEL_KEYS = {
  NEWS: 'newspage.category2',
  EVENT: 'newspage.category3',
  NOTICE: 'newspage.category4',
  GENERAL: 'newspage.category5',
  TRANSPORT: 'newspage.category6',
} as const

const TRANSLATION_TYPE = 'announcement_category'

interface CategoryRef {
  id?: string | null
  code?: string | null
  title?: string | null
}

export function useAnnouncementCategories() {
  const { t, i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language ?? 'es').split('-')[0]
  const [categories, setCategories] = useState<AnnouncementCategory[]>([])
  const [translatedTitles, setTranslatedTitles] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    announcementService
      .getCategories()
      .then((loaded) => {
        if (active) setCategories(loaded)
      })
      .catch(() => {
        if (active) setCategories([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const custom = categories.filter((category) => !category.code)
    if (language === 'es' || custom.length === 0) return
    let active = true
    const items = custom.map((category) => ({ entityId: category.id, fieldName: 'title', originalText: category.title }))
    announcementService
      .translateBatch(TRANSLATION_TYPE, language, items)
      .then((translated) => {
        if (!active) return
        setTranslatedTitles(Object.fromEntries(custom.map((category) => [category.id, translated[`${category.id}:title`] ?? category.title])))
      })
      .catch(() => {
        // Si falla la traducción se muestran los nombres originales.
      })
    return () => {
      active = false
    }
  }, [categories, language])

  const labelFor = useCallback(
    ({ id, code, title }: CategoryRef) => {
      const key = code ? CODE_LABEL_KEYS[code as keyof typeof CODE_LABEL_KEYS] : undefined
      if (key) return t(key)
      if (language !== 'es' && id && translatedTitles[id]) return translatedTitles[id]
      return title ?? ''
    },
    [t, language, translatedTitles],
  )

  const createCategory = useCallback(async (title: string) => {
    const created = await announcementService.createCategory(title)
    setCategories((current) => [...current, created])
    return created
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    await announcementService.deleteCategory(id)
    setCategories((current) => current.filter((category) => category.id !== id))
  }, [])

  return { categories, loading, labelFor, createCategory, deleteCategory }
}
