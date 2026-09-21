import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckIcon, ChevronDownIcon, GlobeIcon } from '@animateicons/react/lucide'
import useDismiss from '../hooks/useDismiss.ts'
import { notify } from '../utils/notifications.ts'
import { SUPPORTED_LANGUAGES } from '../i18n/index.ts'

function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useDismiss({ ref: rootRef, isOpen: open, onClose: () => setOpen(false) })

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language
  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((language) => language.code === currentLanguage)
      ?.label ?? currentLanguage

  const selectLanguage = (code: string) => {
    setOpen(false)
    if (code === currentLanguage) return

    const languageLabel = SUPPORTED_LANGUAGES.find((language) => language.code === code)?.label ?? code
    const translate = i18n.getFixedT(code)

    i18n.changeLanguage(code).then(() => {
      notify.info({
        title: translate('languageSwitcher.changedTitle'),
        // description: translate('languageSwitcher.changedDescription', { language: languageLabel }),
      })
    })
  }

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        className="inline-flex min-w-0 items-center justify-center gap-xs rounded-2xl border border-neutral-200 bg-white p-xs font-body text-sm text-heading transition-colors duration-200 hover:border-link focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 md:min-w-[160px] md:px-md md:py-sm"
        onClick={() => setOpen((open) => !open)}
        aria-label={t('languageSwitcher.label')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <GlobeIcon size={18} />
        <span className="hidden font-semibold md:block">
          {currentLanguageLabel}
        </span>
        <ChevronDownIcon
          size={16}
          className={`hidden text-neutral-500 transition-transform duration-200 md:block ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          className="absolute right-0 top-[calc(100%+var(--spacing-xs))] z-10 m-0 min-w-[168px] list-none rounded-xl border border-neutral-200 bg-white p-xs animate-[language-switcher-in_0.15s_ease-out] md:left-0 md:right-auto md:w-full"
          role="menu"
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <li key={language.code} role="none">
              <button
                type="button"
                role="menuitem"
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-md py-sm text-left font-body text-sm text-heading transition-colors duration-150 hover:bg-orange-100 ${
                  language.code === currentLanguage ? 'font-semibold text-link' : ''
                }`}
                onClick={() => selectLanguage(language.code)}
              >
                <span>{language.label}</span>
                {language.code === currentLanguage && <CheckIcon size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LanguageSwitcher
