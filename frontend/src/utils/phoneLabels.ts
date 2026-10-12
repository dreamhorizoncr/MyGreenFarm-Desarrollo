import es from 'react-phone-number-input/locale/es'
import en from 'react-phone-number-input/locale/en'
import fr from 'react-phone-number-input/locale/fr'

const LABELS = { es, en, fr }

// Nombres de países de react-phone-number-input en el idioma activo (por defecto los trae en inglés).
export function phoneLabels(language: string) {
  const lang = language.split('-')[0] as keyof typeof LABELS
  return LABELS[lang] ?? LABELS.es
}
