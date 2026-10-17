import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { CheckIcon, ChevronDownIcon, PlusIcon, Trash2Icon, XIcon } from '@animateicons/react/lucide'
import useDismiss from '../../hooks/useDismiss.ts'
import { useDropdownMotion } from '../../hooks/useDropdownMotion.ts'
import { validateSafeText } from '../../utils/validators.ts'

export interface CreatableOption {
  id: string
  label: string
}

interface CreatableDropdownLabels {
  placeholder: string
  add: string
  newPlaceholder: string
  delete: string
}

interface CreatableDropdownProps {
  options: CreatableOption[]
  value: string
  onChange: (id: string) => void
  onCreate: (title: string) => Promise<void>
  onDelete: (option: CreatableOption) => void
  labels: CreatableDropdownLabels
  maxLength?: number
}

function CreatableDropdown({ options, value, onChange, onCreate, onDelete, labels, maxLength }: Readonly<CreatableDropdownProps>) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const dropdownMotion = useDropdownMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (adding) inputRef.current?.focus()
  }, [adding])

  const selected = options.find((option) => option.id === value)

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setAdding(false)
  }, [])
  useDismiss({ ref: rootRef, isOpen: open, onClose: closeDropdown })

  const cancelAdding = () => {
    setAdding(false)
    setNewTitle('')
    setError(null)
  }

  const handleAdd = async () => {
    const title = newTitle.trim()
    if (!title) return
    const unsafeError = validateSafeText(title, t)
    setError(unsafeError)
    if (unsafeError) return
    await onCreate(title)
    setNewTitle('')
    setAdding(false)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative mt-xs">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
      >
        <span className={selected ? 'text-heading' : 'text-neutral-500'}>{selected ? selected.label : labels.placeholder}</span>
        <ChevronDownIcon size={18} aria-hidden="true" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            {...dropdownMotion}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 overflow-hidden rounded-xl border border-neutral-200 bg-white p-xs shadow-lg"
          >
            {options.map((option) => (
              <div key={option.id} className="flex w-full items-center justify-between gap-2 text-body-sm">
                <button
                  type="button"
                  aria-pressed={option.id === value}
                  onClick={() => {
                    onChange(option.id)
                    setOpen(false)
                  }}
                  className={`flex w-full flex-1 items-center justify-between gap-2 rounded-lg px-md py-sm text-left transition-colors duration-150 hover:bg-orange-100 ${
                    option.id === value ? 'font-semibold text-link' : 'text-heading'
                  }`}
                >
                  <span className="truncate">{option.label}</span>
                  {option.id === value && <CheckIcon size={16} className="shrink-0" aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(option)}
                  aria-label={`${labels.delete}: ${option.label}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2Icon size={15} />
                </button>
              </div>
            ))}

            <div className="mx-lg my-sm border-t border-neutral-200" />

            {adding ? (
              <>
                <div className="flex items-center gap-sm px-md py-sm">
                  <input
                    ref={inputRef}
                    value={newTitle}
                    maxLength={maxLength}
                    onChange={(e) => {
                      setNewTitle(e.target.value)
                      if (error) setError(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        void handleAdd()
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault()
                        cancelAdding()
                      }
                    }}
                    placeholder={labels.newPlaceholder}
                    aria-invalid={Boolean(error)}
                    className={`h-9 w-full min-w-0 rounded-lg border px-sm font-body text-body-sm outline-none focus:border-heading ${error ? 'border-danger' : 'border-neutral-200'}`}
                  />
                  <button
                    type="button"
                    onClick={() => void handleAdd()}
                    disabled={!newTitle.trim()}
                    aria-label={labels.add}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-white disabled:opacity-50"
                  >
                    <CheckIcon size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={cancelAdding}
                    aria-label={t('admin.cancel')}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
                {error && <p className="m-0 px-md pb-sm font-body text-caption text-danger">{error}</p>}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex w-full items-center gap-sm px-md py-sm text-body-sm font-semibold text-heading transition hover:bg-neutral-50"
              >
                <PlusIcon size={16} aria-hidden="true" />
                {labels.add}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CreatableDropdown
