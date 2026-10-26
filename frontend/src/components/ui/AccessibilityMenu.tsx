import { useCallback, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import {
    Accessibility,
    AudioLinesIcon,
    BookOpenTextIcon,
    MousePointerClickIcon,
    VolumeXIcon,
} from '@animateicons/react/lucide'
import {
    AlignVerticalSpaceAround,
    BellRing,
    BookOpen,
    CirclePause,
    Eye,
    Focus,
    Link2,
    MousePointer2,
    PanelsTopLeft,
    Type,
} from 'lucide-react'
import { useAccessibility, type ColorMode } from '../../contexts/AccessibilityContext'
import { useVoiceReader } from '../../contexts/VoiceReaderContext'
import useDismiss from '../../hooks/useDismiss.ts'
import { useDropdownMotion } from '../../hooks/useDropdownMotion.ts'
import ModalCloseButton from './ModalCloseButton.tsx'
import TabHighlight from './TabHighlight.tsx'

type FontSize = 'normal' | 'large' | 'xlarge'
type MenuTab = 'reading' | 'vision' | 'tools'

const FONT_SIZES: { value: FontSize; label: string }[] = [
    { value: 'normal', label: 'A' },
    { value: 'large', label: 'A+' },
    { value: 'xlarge', label: 'A++' },
]

const COLOR_MODES = [
    { value: 'normal', labelKey: 'accessibility.colorNormal' },
    { value: 'monochrome', labelKey: 'accessibility.colorMonochrome' },
    { value: 'low-saturation', labelKey: 'accessibility.colorLowSaturation' },
    { value: 'high-saturation', labelKey: 'accessibility.colorHighSaturation' },
] as const satisfies readonly { value: ColorMode; labelKey: string }[]

const TABS = [
    { value: 'reading', labelKey: 'accessibility.tabReading' },
    { value: 'vision', labelKey: 'accessibility.tabVision' },
    { value: 'tools', labelKey: 'accessibility.tabTools' },
] as const satisfies readonly { value: MenuTab; labelKey: string }[]

interface ToggleRowProps {
    label: string
    icon: ReactNode
    checked: boolean
    onChange: () => void
    disabled?: boolean
}

function ToggleRow({ label, icon, checked, onChange, disabled = false }: Readonly<ToggleRowProps>) {
    return (
        <label
            className={`relative flex min-h-32 flex-col justify-between rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition-colors hover:border-green-200 ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            }`}
        >
            <span className="flex items-start justify-between gap-2">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-500">
                    {icon}
                </span>
                <span className="relative inline-flex shrink-0 items-center">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    disabled={disabled}
                    className="peer sr-only"
                />
                <span className="h-6 w-11 rounded-full bg-neutral-300 transition-colors peer-checked:bg-green-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                </span>
            </span>
            <span className="font-body text-body-sm font-semibold leading-snug text-heading">{label}</span>
        </label>
    )
}

export default function AccessibilityMenu() {
    const [isOpen, setIsOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<MenuTab>('reading')
    const [activeReadAction, setActiveReadAction] = useState<'page' | 'selection' | null>(null)
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
        colorMode,
        setColorMode,
        highlightLinks,
        toggleHighlightLinks,
        dyslexiaFont,
        toggleDyslexiaFont,
        textSpacing,
        toggleTextSpacing,
        bigCursor,
        toggleBigCursor,
        readingGuide,
        toggleReadingGuide,
        stopAnimations,
        toggleStopAnimations,
        voiceReader,
        toggleVoiceReader,
        autoReadModals,
        toggleAutoReadModals,
        announceAlerts,
        toggleAnnounceAlerts,
        clickToRead,
        toggleClickToRead,
        readFocus,
        toggleReadFocus,
        resetAccessibility,
    } = useAccessibility()

    const { supported: readerSupported, isSpeaking, readCurrentView, readSelection, stop } = useVoiceReader()

    const startReading = useCallback(
        (action: () => void, mode: 'page' | 'selection') => {
            if (!readerSupported) return
            if (!voiceReader) toggleVoiceReader()
            setActiveReadAction(mode)
            action()
        },
        [readerSupported, voiceReader, toggleVoiceReader],
    )

    const readerStatus = !readerSupported
        ? t('accessibility.readerUnsupported')
        : isSpeaking
            ? t('accessibility.readerSpeaking')
            : voiceReader
                ? t('accessibility.readerReady')
                : t('accessibility.readerOff')

    const readerToggleDisabled = !readerSupported || !voiceReader


    return (
        <div
            ref={rootRef}
            data-voice-reader-ui=""
            className="fixed bottom-6 right-6 z-50 text-left"
        >
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
                        className="absolute bottom-16 right-0 w-[min(26rem,calc(100vw-48px))] origin-bottom-right overflow-hidden rounded-[20px] border border-neutral-200 bg-bg-card p-lg shadow-lg"
                    >
                        <div className="flex items-center justify-between gap-md">
                            <h2 style={{ fontSize: '1.375rem', transform: 'none' }} className="m-0 min-w-0 font-heading font-bold leading-tight text-heading">
                                {t('accessibility.title')}
                            </h2>
                            <ModalCloseButton onClick={close} aria-label={t('common.close')} />
                        </div>

                        <div
                            role="tablist"
                            aria-label={t('accessibility.title')}
                            className="mt-md grid grid-cols-3 gap-2"
                        >
                            {TABS.map(({ value, labelKey }) => {
                                const isActive = activeTab === value
                                return (
                                    <button
                                        key={value}
                                        type="button"
                                        role="tab"
                                        id={`a11y-tab-${value}`}
                                        aria-selected={isActive}
                                        aria-controls={isActive ? `a11y-panel-${value}` : undefined}
                                        onClick={() => setActiveTab(value)}
                                        className={`relative isolate whitespace-nowrap rounded-full border px-2 py-2 font-body text-body-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
                                            isActive ? 'border-orange-500 text-green-500' : 'border-neutral-200 bg-white text-neutral-600 hover:border-green-500 hover:text-green-500'
                                        }`}
                                    >
                                        {t(labelKey)}
                                    </button>
                                )
                            })}
                        </div>

                        <div className="modal-scroll mt-md max-h-[min(58vh,28rem)] overflow-y-auto pr-1">
                            {activeTab === 'reading' && (
                                <section
                                    role="tabpanel"
                                    id="a11y-panel-reading"
                                    aria-labelledby="a11y-tab-reading"
                                >
                                    <div className="rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-500">
                                                <AudioLinesIcon size={20} isAnimated={isSpeaking} aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-body text-body-sm font-semibold leading-tight text-heading">
                                                    {t('accessibility.readerTitle')}
                                                </span>
                                                <span
                                                    role="status"
                                                    className="mt-0.5 block font-body text-caption leading-snug text-neutral-600"
                                                >
                                                    {readerStatus}
                                                </span>
                                            </span>
                                            <label className="relative inline-flex shrink-0 cursor-pointer items-center" title={t('accessibility.enableReader')}>
                                                <span className="sr-only">{t('accessibility.enableReader')}</span>
                                                <input
                                                    type="checkbox"
                                                    checked={voiceReader}
                                                    onChange={toggleVoiceReader}
                                                    disabled={!readerSupported}
                                                    aria-label={t('accessibility.enableReader')}
                                                    className="peer sr-only"
                                                />
                                                <span className="relative h-6 w-11 rounded-full bg-neutral-300 transition-colors peer-checked:bg-green-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-link after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:cursor-not-allowed peer-disabled:opacity-50" />
                                            </label>
                                        </div>

                                        <div className="mt-sm grid grid-cols-1 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => startReading(readCurrentView, 'page')}
                                                disabled={!readerSupported}
                                                aria-pressed={activeReadAction === 'page'}
                                                className={`flex h-11 w-full items-center justify-center gap-2 rounded-full border px-4 font-body text-body-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${activeReadAction === 'page' ? 'border-green-500 bg-green-500 text-white' : 'border-green-500 bg-white text-green-500'}`}
                                            >
                                                <BookOpenTextIcon size={17} aria-hidden="true" />
                                                {t('accessibility.readPage')}
                                            </button>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startReading(readSelection, 'selection')}
                                                    disabled={!readerSupported}
                                                    aria-pressed={activeReadAction === 'selection'}
                                                    className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-full border px-2 font-body text-caption font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${activeReadAction === 'selection' ? 'border-green-500 bg-green-500 text-white' : 'border-green-500 bg-white text-green-500'}`}
                                                >
                                                    <MousePointerClickIcon size={15} aria-hidden="true" />
                                                    {t('accessibility.readSelection')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { stop(); setActiveReadAction(null) }}
                                                    disabled={!isSpeaking}
                                                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-full border border-orange-500 bg-white px-2 font-body text-caption font-semibold text-orange-600 transition-colors hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                                                >
                                                    <VolumeXIcon size={15} aria-hidden="true" />
                                                    {t('accessibility.stopReading')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-sm grid grid-cols-2 gap-sm">
                                        <ToggleRow
                                            label={t('accessibility.autoReadModals')}
                                            icon={<PanelsTopLeft size={20} aria-hidden="true" />}
                                            checked={autoReadModals}
                                            onChange={toggleAutoReadModals}
                                            disabled={readerToggleDisabled}
                                        />
                                        <ToggleRow
                                            label={t('accessibility.announceAlerts')}
                                            icon={<BellRing size={20} aria-hidden="true" />}
                                            checked={announceAlerts}
                                            onChange={toggleAnnounceAlerts}
                                            disabled={readerToggleDisabled}
                                        />
                                        <ToggleRow
                                            label={t('accessibility.clickToRead')}
                                            icon={<MousePointer2 size={20} aria-hidden="true" />}
                                            checked={clickToRead}
                                            onChange={toggleClickToRead}
                                            disabled={readerToggleDisabled}
                                        />
                                        <ToggleRow
                                            label={t('accessibility.readFocus')}
                                            icon={<Focus size={20} aria-hidden="true" />}
                                            checked={readFocus}
                                            onChange={toggleReadFocus}
                                            disabled={readerToggleDisabled}
                                        />
                                    </div>

                                </section>
                            )}

                            {activeTab === 'vision' && (
                                <section
                                    role="tabpanel"
                                    id="a11y-panel-vision"
                                    aria-labelledby="a11y-tab-vision"
                                >
                                    <div>
                                        <span className="mb-xs block font-body text-body-sm font-semibold text-heading">
                                            {t('accessibility.fontSize')}
                                        </span>
                                        <div
                                            className="isolate grid grid-cols-3 gap-sm"
                                            role="radiogroup"
                                            aria-label={t('accessibility.fontSize')}
                                        >
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
                                            isActive ? 'text-white' : 'bg-transparent text-green-500 hover:bg-green-50'
                                                        }`}
                                                    >
                                                        {isActive && (
                                                            <TabHighlight
                                                                layoutId="accessibility-font-size"
                                                                className="bg-green-500"
                                                            />
                                                        )}
                                                        {label}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="mt-md grid grid-cols-2 gap-5">
                                        <ToggleRow
                                            label={t('accessibility.enableContrast')}
                                            icon={<Eye size={20} aria-hidden="true" />}
                                            checked={highContrast}
                                            onChange={toggleHighContrast}
                                        />
                                        <ToggleRow
                                            label={t('accessibility.enableLinks', { defaultValue: 'Resaltar enlaces' })}
                                            icon={<Link2 size={20} aria-hidden="true" />}
                                            checked={highlightLinks}
                                            onChange={toggleHighlightLinks}
                                        />
                                    </div>

                                    <div className="mt-md grid grid-cols-2 gap-5">
                                        <ToggleRow
                                            label={t('accessibility.dyslexiaFont')}
                                            icon={<Type size={20} aria-hidden="true" />}
                                            checked={dyslexiaFont}
                                            onChange={toggleDyslexiaFont}
                                        />
                                        <ToggleRow
                                            label={t('accessibility.textSpacing')}
                                            icon={<AlignVerticalSpaceAround size={20} aria-hidden="true" />}
                                            checked={textSpacing}
                                            onChange={toggleTextSpacing}
                                        />
                                    </div>

                                    <div className="mt-md">
                                        <span className="mb-xs block font-body text-body-sm font-semibold text-heading">
                                            {t('accessibility.colorMode')}
                                        </span>
                                        <div
                                            className="isolate grid grid-cols-2 gap-sm"
                                            role="radiogroup"
                                            aria-label={t('accessibility.colorMode')}
                                        >
                                            {COLOR_MODES.map(({ value, labelKey }) => {
                                                const isActive = colorMode === value
                                                return (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={isActive}
                                                        onClick={() => setColorMode(value)}
                                                        className={`relative rounded-full border border-green-500 px-2 py-xs font-body text-caption font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
                                                            isActive
                                                                ? 'text-white'
                                                                : 'bg-transparent text-green-500 hover:bg-green-50'
                                                        }`}
                                                    >
                                                        {isActive && (
                                                            <TabHighlight
                                                                layoutId="accessibility-color-mode"
                                                                className="bg-green-500"
                                                            />
                                                        )}
                                                        {t(labelKey)}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </section>
                            )}

                            {activeTab === 'tools' && (
                                <section
                                    role="tabpanel"
                                    id="a11y-panel-tools"
                                    aria-labelledby="a11y-tab-tools"
                                >
                                    <div className="grid grid-cols-2 gap-sm">
                                        <ToggleRow
                                            label={t('accessibility.bigCursor')}
                                            icon={<MousePointer2 size={20} aria-hidden="true" />}
                                            checked={bigCursor}
                                            onChange={toggleBigCursor}
                                        />
                                        <ToggleRow
                                            label={t('accessibility.readingGuide')}
                                            icon={<BookOpen size={20} aria-hidden="true" />}
                                            checked={readingGuide}
                                            onChange={toggleReadingGuide}
                                        />
                                        <ToggleRow
                                            label={t('accessibility.stopAnimations')}
                                            icon={<CirclePause size={20} aria-hidden="true" />}
                                            checked={stopAnimations}
                                            onChange={toggleStopAnimations}
                                        />
                                    </div>

                                    <div className="mt-md flex items-start gap-2 font-body text-caption text-neutral-600">
                                        <MousePointerClickIcon
                                            size={16}
                                            aria-hidden="true"
                                            className="mt-0.5 shrink-0 text-green-500"
                                        />
                                        {t('accessibility.toolsHint')}
                                    </div>
                                </section>
                            )}
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
