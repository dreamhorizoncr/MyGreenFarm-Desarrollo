import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { SUPPORTED_LANGUAGES } from '../i18n/index.ts'

function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  const currentLanguage = i18n.resolvedLanguage ?? i18n.language
  const currentLanguageLabel =
    SUPPORTED_LANGUAGES.find((language) => language.code === currentLanguage)
      ?.label ?? currentLanguage

  const selectLanguage = (code: string) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="language-switcher" ref={rootRef}>
      <button
        type="button"
        className="language-switcher__button"
        onClick={() => setOpen((open) => !open)}
        aria-label={t('languageSwitcher.label')}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Globe size={18} />
        <span className="language-switcher__label hidden md:block">
          {currentLanguageLabel}
        </span>
        <ChevronDown
          size={16}
          className={`language-switcher__chevron hidden md:block ${open ? 'is-open' : ''}`}
        />
      </button>

      {open && (
        <ul className="language-switcher__menu" role="menu">
          {SUPPORTED_LANGUAGES.map((language) => (
            <li key={language.code} role="none">
              <button
                type="button"
                role="menuitem"
                className={
                  language.code === currentLanguage
                    ? 'language-switcher__option language-switcher__option--active'
                    : 'language-switcher__option'
                }
                onClick={() => selectLanguage(language.code)}
              >
                <span className="language-switcher__option-label">
                  {language.label}
                </span>
                {language.code === currentLanguage && <Check size={16} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default LanguageSwitcher
