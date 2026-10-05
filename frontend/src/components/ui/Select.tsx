import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon } from '@animateicons/react/lucide'

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
  'aria-label'?: string
  'aria-labelledby'?: string
}

interface MenuPosition {
  top: number
  left: number
  width: number
}

// Custom dropdown that mirrors LanguageSwitcher's menu style (rounded card,
// hover:bg-orange-100, bold + link-colored selected item with a checkmark)
// so every dashboard combobox looks and behaves the same way.
//
// The menu is rendered through a portal into document.body instead of as a
// normal absolutely-positioned child. Several dashboard cards lift on hover
// (hover:-translate-y-1), and CSS transforms create a new stacking context —
// an in-place absolute menu would get trapped inside that context and could
// render clipped or behind sibling rows. Portaling sidesteps that entirely.
function Select({
  value,
  onChange,
  options,
  id,
  placeholder,
  disabled = false,
  className = 'w-full rounded-xl border border-neutral-200 bg-white px-md',
  menuClassName = '',
  ...aria
}: Readonly<SelectProps>) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)

  // Custom dismiss handling (not the shared useDismiss hook) because the menu
  // is portaled out of rootRef: a click inside it would otherwise look like a
  // click "outside" and close the menu before the option's own click fires.
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

  useLayoutEffect(() => {
    if (!open) return

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setPosition({ top: rect.bottom + 4, left: rect.left, width: rect.width })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  useEffect(() => {
    if (!open) setPosition(null)
  }, [open])

  const selected = options.find((option) => option.value === value)

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
        className={`flex h-11 items-center justify-between gap-xs text-left font-body text-body-sm text-body-text outline-none transition-colors focus:border-heading disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
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

      {open && position && (
        <ul
          ref={menuRef}
          style={{ top: position.top, left: position.left, width: position.width }}
          className={`fixed z-[10000] m-0 max-h-[240px] list-none overflow-y-auto rounded-xl border border-neutral-200 bg-white p-xs shadow-lg animate-[language-switcher-in_0.15s_ease-out] ${menuClassName}`}
          role="listbox"
        >
          {options.map((option) => (
            <li key={option.value} role="none">
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-md py-sm text-left font-body text-body-sm text-heading transition-colors duration-150 hover:bg-orange-100 ${
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
        </ul>
      )}
    </div>
  );
}

export default Select
