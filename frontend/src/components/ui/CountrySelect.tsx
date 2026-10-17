
import { useEffect, useMemo, useRef, useState, type ElementType } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckIcon, ChevronDownIcon, SearchIcon } from '@animateicons/react/lucide'
import { getCountryCallingCode, type Country } from 'react-phone-number-input'
import useDismiss from '../../hooks/useDismiss.ts'
import { AnimatePresence, motion } from 'motion/react'
import { useMenuPosition } from '../../hooks/useMenuPosition.ts'
import { useDropdownMotion } from '../../hooks/useDropdownMotion.ts'

interface CountryOption {
  value?: Country
  label: string
  divider?: boolean
}

interface CountrySelectProps {
  value?: Country
  onChange: (value?: Country) => void
  options: CountryOption[]
  iconComponent: ElementType<{ country?: Country; label: string }>
  disabled?: boolean
  readOnly?: boolean
  'aria-label'?: string
}

const MENU_MAX_HEIGHT = 320
const MENU_MIN_WIDTH = 300

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const callingCode = (country?: Country) => (country ? `+${getCountryCallingCode(country)}` : '')

function CountrySelect({
  value,
  onChange,
  options,
  iconComponent: Flag,
  disabled = false,
  readOnly = false,
  'aria-label': ariaLabel,
}: Readonly<CountrySelectProps>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const close = () => {
    setOpen(false)
    setQuery('')
  }
  useDismiss({ ref: rootRef, isOpen: open, onClose: close })

  const position = useMenuPosition({ triggerRef, open, desiredHeight: MENU_MAX_HEIGHT, maxHeight: MENU_MAX_HEIGHT, minWidth: MENU_MIN_WIDTH })

  const filtered = useMemo(() => {
    const term = normalize(query.trim())
    if (!term) return options
    return options.filter((option) => !option.divider && (
      normalize(option.label).includes(term) || callingCode(option.value).includes(term) || option.value?.toLowerCase() === term
    ))
  }, [options, query])

  const keyedOptions = useMemo(() => {
    const result: { option: CountryOption; key: string }[] = []
    let previous = 'start'
    for (const option of filtered) {
      const key = option.divider ? `divider-after-${previous}` : (option.value ?? 'international')
      if (!option.divider) previous = key
      result.push({ option, key })
    }
    return result
  }, [filtered])

  const isPositioned = position !== null
  useEffect(() => {
    if (!open || !isPositioned) return
    searchRef.current?.focus({ preventScroll: true })
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [open, isPositioned])

  const selectedLabel = options.find((option) => option.value === value)?.label ?? ''

  const dropdownMotion = useDropdownMotion(position?.bottom !== undefined)

  return (
    <div ref={rootRef} className="relative mr-xs flex items-center self-stretch">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || readOnly}
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex h-full items-center gap-2xs rounded-lg px-2xs outline-none transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex w-6 shrink-0 items-center">
          <Flag country={value} label={selectedLabel} />
        </span>
        <ChevronDownIcon size={14} aria-hidden="true" className={`shrink-0 text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
      {open && position && (
        <motion.div
          {...dropdownMotion}
          style={{ top: position.top, bottom: position.bottom, left: position.left, width: position.width, maxHeight: position.maxHeight }}
          className="fixed z-[10000] flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg"
        >
          <div className="flex shrink-0 items-center gap-xs border-b border-neutral-100 px-md py-xs">
            <SearchIcon size={16} aria-hidden="true" className="shrink-0 text-neutral-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('common.countrySearch.placeholder')}
              aria-label={t('common.countrySearch.placeholder')}
              className="h-9 min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text outline-none placeholder:text-neutral-400"
            />
          </div>

          <ul ref={listRef} role="listbox" aria-label={ariaLabel} className="m-0 min-h-0 flex-1 list-none overflow-y-auto p-xs">
            {filtered.length === 0 && (
              <li className="px-md py-sm font-body text-body-sm text-neutral-500">{t('common.countrySearch.empty')}</li>
            )}
            {keyedOptions.map(({ option, key }) => option.divider ? (
              <li key={key} role="none">
                <hr className="mx-md my-xs border-0 border-t border-neutral-200" />
              </li>
            ) : (
              <li key={key} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value)
                    close()
                  }}
                  className={`flex w-full items-center gap-sm rounded-lg px-md py-sm text-left font-body text-body-sm text-heading transition-colors duration-150 hover:bg-orange-100 ${
                    option.value === value ? 'font-semibold text-link' : ''
                  }`}
                >
                  <span className="flex w-6 shrink-0 items-center">
                    <Flag country={option.value} label={option.label} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  <span className="shrink-0 text-neutral-500">{callingCode(option.value)}</span>
                  {option.value === value && <CheckIcon size={16} className="shrink-0" />}
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}

export default CountrySelect
