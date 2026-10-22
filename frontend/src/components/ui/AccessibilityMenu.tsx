import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { Accessibility } from '@animateicons/react/lucide'
import { useAccessibility } from '../../contexts/AccessibilityContext'
import useDismiss from '../../hooks/useDismiss.ts'
import { useDropdownMotion } from '../../hooks/useDropdownMotion.ts'
import ModalCloseButton from './ModalCloseButton.tsx'
import TabHighlight from './TabHighlight.tsx'

type FontSize = 'normal' | 'large' | 'xlarge'

const FONT_SIZES: { value: FontSize; label: string }[] = [
    { value: 'normal', label: 'A' },
    { value: 'large', label: 'A+' },
    { value: 'xlarge', label: 'A++' },
]

interface ToggleRowProps {
    label: string
    checked: boolean
    onChange: () => void
}

function ToggleRow({ label, checked, onChange }: Readonly<ToggleRowProps>) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-md py-sm">
            <span className="font-body text-body-sm font-semibold text-heading">{label}</span>
            <span className="relative inline-flex shrink-0 items-center">
                <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
                <span className="h-6 w-11 rounded-full bg-neutral-300 transition-colors peer-checked:bg-green-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
            </span>
        </label>
    )
}

export default function AccessibilityMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const { t } = useTranslation()
    const dropdownMotion = useDropdownMotion(true)
    const close = useCallback(() => setIsOpen(false), [])
    useDismiss({ ref: rootRef, isOpen, onClose: close })
    const {
        fontSize,
        setFontSize,
        highContrast,
        toggleHighContrast,
        grayscale,
        toggleGrayscale,
        highlightLinks,
        toggleHighlightLinks,
        resetAccessibility,
    } = useAccessibility()

    return (
        <div ref={rootRef} className="fixed bottom-6 right-6 z-50 text-left">
            {/* Botón flotante */}
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-label={t('accessibility.menuAria', { defaultValue: 'Menú de accesibilidad' })}
                aria-expanded={isOpen}
                aria-controls="accessibility-panel"
                className="flex size-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-heading shadow-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
                <Accessibility size={22} isAnimated={false} aria-hidden="true" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        {...dropdownMotion}
                        id="accessibility-panel"
                        role="dialog"
                        aria-label={t('accessibility.title')}
                        className="absolute bottom-16 right-0 w-[min(20rem,calc(100vw-48px))] origin-bottom-right rounded-[20px] border border-neutral-200 bg-bg-card p-lg shadow-lg"
                    >
                        <div className="flex items-center justify-between gap-md">
                            <h2 style={{ fontSize: '1.375rem', transform: 'none' }} className="m-0 min-w-0 font-heading font-bold leading-tight text-heading">
                                {t('accessibility.title')}
                            </h2>
                            <ModalCloseButton onClick={close} aria-label={t('common.close')} />
                        </div>

                        <div className="mt-md">
                            <span className="mb-xs block font-body text-body-sm font-semibold text-heading">
                                {t('accessibility.fontSize', { defaultValue: 'Tamaño del texto' })}
                            </span>
                            <div className="isolate grid grid-cols-3 gap-sm" role="radiogroup" aria-label={t('accessibility.fontSize')}>
                                {FONT_SIZES.map(({ value, label }) => {
                                    const isActive = fontSize === value
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            role="radio"
                                            aria-checked={isActive}
                                            onClick={() => setFontSize(value)}
                                            className={`relative rounded-full border border-green-500 py-xs font-body text-body-sm font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
                                                isActive ? 'text-white' : 'bg-transparent text-heading hover:bg-green-50'
                                            }`}
                                        >
                                            {isActive && <TabHighlight layoutId="accessibility-font-size" className="bg-green-500" />}
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="mt-md divide-y divide-neutral-100 border-y border-neutral-100">
                            <ToggleRow label={t('accessibility.enableContrast')} checked={highContrast} onChange={toggleHighContrast} />
                            <ToggleRow label={t('accessibility.enableGrayscale')} checked={grayscale} onChange={toggleGrayscale} />
                            <ToggleRow
                                label={t('accessibility.enableLinks', { defaultValue: 'Resaltar enlaces' })}
                                checked={highlightLinks}
                                onChange={toggleHighlightLinks}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={resetAccessibility}
                            className="mt-md h-11 w-full rounded-full bg-orange-500 font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                        >
                            {t('accessibility.reset', { defaultValue: 'Restablecer configuración' })}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
