import es from 'react-phone-number-input/locale/es'
import en from 'react-phone-number-input/locale/en'
import fr from 'react-phone-number-input/locale/fr'

const LABELS = { es, en, fr }

/**
 * @param language - current language
 * @returns the country names of the phone input in that language, Spanish by default
 */
export function phoneLabels(language: string) {
  const lang = language.split('-')[0] as keyof typeof LABELS
  return LABELS[lang] ?? LABELS.es
}
