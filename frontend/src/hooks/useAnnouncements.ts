import { useState } from 'react'
import { announcementService } from '../services/announcement.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Announcement } from '../types/announcement.ts'

const SOURCE_LANG = 'es'
const ENTITY_TYPE = 'announcement'

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnnouncements = async (lang: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await announcementService.getAnnouncements(SOURCE_LANG)

      let result = data
      if (lang !== SOURCE_LANG) {
        const items = data.flatMap((a) => [
          { entityId: a.id, fieldName: 'title', originalText: a.title },
          { entityId: a.id, fieldName: 'content', originalText: a.content },
        ])
        const translated = await announcementService.translateBatch(ENTITY_TYPE, lang, items)
        result = data.map((a) => ({
          ...a,
          title: translated[`${a.id}:title`] ?? a.title,
          content: translated[`${a.id}:content`] ?? a.content,
        }))
      }

      setAnnouncements(result)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return { announcements, loading, error, fetchAnnouncements }
}