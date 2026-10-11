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
  // Se usa top al abrir hacia abajo y bottom al abrir hacia arriba.
  top?: number
  bottom?: number
  left: number
  width: number
  maxHeight: number
}

const MENU_GAP = 4
const VIEWPORT_MARGIN = 8
const MENU_MAX_HEIGHT = 240
// Alto aproximado de cada opción (py-sm + texto) más el padding de la lista.
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
  ...aria
}: Readonly<SelectProps>) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<MenuPosition | null>(null)
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

  useLayoutEffect(() => {
    if (!open) return

    // El menú es fixed (para no quedar recortado por el modal), así que no agranda el área de scroll.
    // Por eso se abre hacia donde quepa: primero dentro del panel del modal (form/dialog) y si no, dentro
    // de la pantalla; y su alto se limita al espacio visible para que nunca quede cortado.
    const updatePosition = () => {
      const trigger = triggerRef.current
      const rect = trigger?.getBoundingClientRect()
      if (!trigger || !rect) return
      const desiredHeight = Math.min(MENU_MAX_HEIGHT, options.length * OPTION_HEIGHT + MENU_PADDING)
      const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP - VIEWPORT_MARGIN
      const spaceAbove = rect.top - MENU_GAP - VIEWPORT_MARGIN

      const panel = trigger.closest('form, dialog')?.getBoundingClientRect()
      const panelBottom = panel ? Math.min(panel.bottom, window.innerHeight - VIEWPORT_MARGIN) : null
      const panelTop = panel ? Math.max(panel.top, VIEWPORT_MARGIN) : null
      const fitsBelowInPanel = panelBottom !== null && panelBottom - rect.bottom - MENU_GAP >= desiredHeight
      const fitsAboveInPanel = panelTop !== null && rect.top - MENU_GAP - panelTop >= desiredHeight

      let openUp: boolean
      if (fitsBelowInPanel) openUp = false
      else if (fitsAboveInPanel) openUp = true
      else openUp = spaceBelow < desiredHeight && spaceAbove > spaceBelow
      const maxHeight = Math.min(MENU_MAX_HEIGHT, Math.max(openUp ? spaceAbove : spaceBelow, OPTION_HEIGHT))
      setPosition(openUp
        ? { bottom: window.innerHeight - rect.top + MENU_GAP, left: rect.left, width: rect.width, maxHeight }
        : { top: rect.bottom + MENU_GAP, left: rect.left, width: rect.width, maxHeight })
    }

    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, options.length])

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
          style={{ top: position.top, bottom: position.bottom, left: position.left, width: position.width, maxHeight: position.maxHeight }}
          className={`fixed z-[10000] m-0 list-none overflow-y-auto rounded-xl border border-neutral-200 bg-white p-xs shadow-lg animate-[language-switcher-in_0.15s_ease-out] ${menuClassName}`}
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
