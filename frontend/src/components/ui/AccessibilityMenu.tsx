import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Accessibility } from '@animateicons/react/lucide'
import { useAccessibility } from '../../contexts/AccessibilityContext'

export default function AccessibilityMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const { t } = useTranslation()
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
        <div className="fixed bottom-6 right-6 z-50 text-left">
            {/* Botón flotante */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('accessibility.menuAria', { defaultValue: 'Menú de accesibilidad' })}
                className="flex size-12 items-center justify-center rounded-full border border-neutral-200 bg-white text-heading shadow-lg transition-all duration-300 hover:scale-105 hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
                <Accessibility size={22} isAnimated={false} aria-hidden="true" />
            </button>

            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 rounded-[20px] border border-neutral-200 bg-white p-lg shadow-xl animate-[modal-in_0.2s_ease-out]">
                    <div className="flex items-center justify-between pb-sm border-b border-neutral-100">
                        <h3 className="m-0 font-heading text-h5 font-bold text-heading">
                            {t('accessibility.title')}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-neutral-400 hover:text-heading font-bold"
                        >
                            ✕
                        </button>
                    </div>

                    <div className="mt-md flex flex-col gap-md">
                        <div>
                            <span className="block font-body text-body-sm font-semibold text-heading mb-xs">
                                {t('accessibility.fontSize', { defaultValue: 'Tamaño del texto' })}
                            </span>
                            <div className="grid grid-cols-3 gap-xs">
                                <button
                                    type="button"
                                    onClick={() => setFontSize('normal')}
                                    className={`rounded-full border py-1.5 font-body text-body-sm font-semibold transition-colors ${
                                        fontSize === 'normal'
                                            ? 'border-green-500 bg-green-500 text-white'
                                            : 'border-neutral-200 text-heading hover:bg-green-50'
                                    }`}
                                >
                                    A
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFontSize('large')}
                                    className={`rounded-full border py-1.5 font-body text-body-sm font-semibold transition-colors ${
                                        fontSize === 'large'
                                            ? 'border-green-500 bg-green-500 text-white'
                                            : 'border-neutral-200 text-heading hover:bg-green-50'
                                    }`}
                                >
                                    A+
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFontSize('xlarge')}
                                    className={`rounded-full border py-1.5 font-body text-body-sm font-semibold transition-colors ${
                                        fontSize === 'xlarge'
                                            ? 'border-green-500 bg-green-500 text-white'
                                            : 'border-neutral-200 text-heading hover:bg-green-50'
                                    }`}
                                >
                                    A++
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-xs pt-xs border-t border-neutral-100">
                            <button
                                type="button"
                                onClick={toggleHighContrast}
                                className={`w-full rounded-full border px-md py-xs text-left font-body text-body-sm font-semibold transition-colors ${
                                    highContrast
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : 'border-neutral-200 text-heading hover:bg-green-50'
                                }`}
                            >
                                {highContrast
                                    ? t('accessibility.disableContrast')
                                    : t('accessibility.enableContrast')}
                            </button>

                            <button
                                type="button"
                                onClick={toggleGrayscale}
                                className={`w-full rounded-full border px-md py-xs text-left font-body text-body-sm font-semibold transition-colors ${
                                    grayscale
                                        ? 'border-green-500 bg-green-500 text-white'
                                        : 'border-neutral-200 text-heading hover:bg-green-50'
                                }`}
                            >
                                {grayscale
                                    ? t('accessibility.disableGrayscale')
                                    : t('accessibility.enableGrayscale')}
                            </button>

                            <button
                                type="button"
                                onClick={toggleHighlightLinks}
                                className={`w-full rounded-full border px-md py-xs text-left font-body text-body-sm font-semibold transition-colors ${
                                    highlightLinks
                                        ? 'border-green-500 bg-green-500 rounded-full  text-white'
                                        : 'border-neutral-200 text-heading hover:bg-green-50'
                                }`}
                            >
                                {highlightLinks
                                    ? t('accessibility.disableLinks', { defaultValue: 'Quitar resaltado de enlaces' })
                                    : t('accessibility.enableLinks', { defaultValue: 'Resaltar enlaces' })}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={resetAccessibility}
                            className="mt-xs w-full rounded-full border border-neutral-200 bg-orange-500 py-2 text-center font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600"
                        >
                            {t('accessibility.reset', { defaultValue: 'Restablecer configuración' })}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}