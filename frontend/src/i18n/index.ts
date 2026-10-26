import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './locales/es'
import en from './locales/en'
import fr from './locales/fr'

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const

const resources = {
  es: { translation: es },
  en: { translation: en },
  fr: { translation: fr },
} as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'fr'],
    nonExplicitSupportedLngs: true,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

function syncDocumentLanguage(language: string) {
  if (typeof document === 'undefined') return
  const base = (language || 'es').split('-')[0].toLowerCase()
  document.documentElement.lang = ['es', 'en', 'fr'].includes(base) ? base : 'es'
}

syncDocumentLanguage(i18n.resolvedLanguage || i18n.language || 'es')
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
