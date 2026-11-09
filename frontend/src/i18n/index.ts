import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './locales/es'

export const SUPPORTED_LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
] as const

type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

const loaders: Record<Exclude<LanguageCode, 'es'>, () => Promise<{ default: unknown }>> = {
  en: () => import('./locales/en'),
  fr: () => import('./locales/fr'),
}

const baseLanguage = (language?: string): LanguageCode => {
  const base = (language || 'es').split('-')[0].toLowerCase()
  return base === 'en' || base === 'fr' ? base : 'es'
}

export async function ensureLanguage(language?: string) {
  const code = baseLanguage(language)
  if (code === 'es' || i18n.hasResourceBundle(code, 'translation')) return
  const { default: translation } = await loaders[code]()
  i18n.addResourceBundle(code, 'translation', translation, true, true)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es } },
    partialBundledLanguages: true,
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

const changeLanguage = i18n.changeLanguage.bind(i18n)
i18n.changeLanguage = (async (language?: string, callback?: Parameters<typeof changeLanguage>[1]) => {
  await ensureLanguage(language)
  return changeLanguage(language, callback)
}) as typeof i18n.changeLanguage

function syncDocumentLanguage(language: string) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = baseLanguage(language)
}

syncDocumentLanguage(i18n.resolvedLanguage || i18n.language || 'es')
i18n.on('languageChanged', syncDocumentLanguage)

export default i18n
