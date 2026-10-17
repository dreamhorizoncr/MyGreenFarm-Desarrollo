import { useEffect, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon } from '@animateicons/react/lucide'
import { AnimatePresence, motion } from 'motion/react'
import { useMenuPosition } from '../../hooks/useMenuPosition.ts'
import { useDropdownMotion } from '../../hooks/useDropdownMotion.ts'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: readonly SelectOption[]
  id?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  menuClassName?: string
  compact?: boolean
  'aria-label'?: string
  'aria-labelledby'?: string
}

const MENU_MAX_HEIGHT = 240
const OPTION_HEIGHT = 40
const MENU_PADDING = 8

function Select({
  value,
  onChange,
  options,
  id,
  placeholder,
  disabled = false,
  className = 'w-full rounded-xl border border-neutral-200 bg-white px-md',
  menuClassName = '',
  compact = false,
  ...aria
}: Readonly<SelectProps>) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeydown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeydown)
    }
  }, [open])

  const position = useMenuPosition({
    triggerRef,
    open,
    desiredHeight: Math.min(MENU_MAX_HEIGHT, options.length * OPTION_HEIGHT + MENU_PADDING),
    maxHeight: MENU_MAX_HEIGHT,
  })

  const selected = options.find((option) => option.value === value)

  const dropdownMotion = useDropdownMotion(position?.bottom !== undefined)

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        {...aria}
        className={`flex items-center justify-between gap-xs text-left font-body text-body-text ${compact ? 'h-8 text-caption' : 'h-11 text-body-sm'} outline-none transition-colors focus:border-heading disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <span className={`truncate ${selected ? '' : 'text-neutral-400'}`}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <ChevronDownIcon
          size={16}
          className={`shrink-0 text-neutral-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
      {open && position && (
        <motion.ul
          {...dropdownMotion}
          ref={menuRef}
          style={{ top: position.top, bottom: position.bottom, left: position.left, width: position.width, maxHeight: position.maxHeight }}
          className={`fixed z-[10000] m-0 list-none overflow-y-auto rounded-xl border border-neutral-200 bg-white p-xs shadow-lg ${menuClassName}`}
          role="listbox"
        >
          {options.map((option) => (
            <li key={option.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`flex w-full items-center justify-between gap-2 rounded-lg text-left font-body text-heading ${compact ? 'px-sm py-xs text-caption' : 'px-md py-sm text-body-sm'} transition-colors duration-150 hover:bg-orange-100 ${
                  option.value === value ? 'font-semibold text-link' : ''
                }`}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <CheckIcon size={16} className="shrink-0" />}
              </button>
            </li>
          ))}
        </motion.ul>
      )}
      </AnimatePresence>
    </div>
  );
}

export default Select
