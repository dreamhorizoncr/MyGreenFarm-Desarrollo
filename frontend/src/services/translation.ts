import { apiClient } from './api.ts'

/** A text field of an entity to translate. */
export interface TranslationItem {
  /** ID of the entity the text belongs to. */
  entityId: string
  /** Name of the field, for example `title`. */
  fieldName: string
  /** Text in its original language (Spanish). */
  originalText: string
}

/**
 * Translates several fields of the same entity type in a single request. The backend keeps the
 * translations, so each text is only translated once.
 *
 * @param entityType - type of the entities, for example `club` or `gallery`
 * @param targetLanguage - language code; a regional variant such as `en-US` is reduced to `en`
 * @param items - fields to translate
 * @returns the translations keyed by `entityId:fieldName`; a field without a translation is missing
 */
export async function translateBatch(
  entityType: string,
  targetLanguage: string,
  items: TranslationItem[],
): Promise<Record<string, string>> {
  if (items.length === 0) return {}
  const response = await apiClient.post<Record<string, string>>('/translations/batch', {
    entityType,
    targetLanguage: targetLanguage?.split('-')[0] || 'es',
    items,
  })
  return response.data
}
