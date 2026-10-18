import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ChevronDownIcon, ClockIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'motion/react'
import { countScheduleDays, formatScheduleEntries } from '../utils/schedule.ts'
import useDismiss from '../hooks/useDismiss.ts'
import { useDropdownMotion } from '../hooks/useDropdownMotion.ts'
import ClubScheduleCard from './ClubScheduleCard.tsx'

interface SchedulePopoverProps {
    schedule: string | null | undefined
    // Avisa al modal que lo contiene para que Escape/clic afuera cierren primero el horario
    onOpenChange?: (open: boolean) => void
}

// «N días a la semana · Ver horarios»: el enlace despliega la tarjeta del horario en un mini modal
function SchedulePopover({ schedule, onOpenChange }: Readonly<SchedulePopoverProps>) {
    const { t, i18n } = useTranslation()
    const popoverId = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const dropdownMotion = useDropdownMotion()

    const changeOpen = useCallback((next: boolean) => {
        setOpen(next)
        onOpenChange?.(next)
    }, [onOpenChange])
    const close = useCallback(() => changeOpen(false), [changeOpen])
    useDismiss({ ref: rootRef, isOpen: open, onClose: close })

    // Si el horario queda cortado por el borde del modal, desplaza hasta que se vea completo
    useEffect(() => {
        if (!open) return
        const timer = window.setTimeout(() => {
            document.getElementById(popoverId)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }, 60)
        return () => window.clearTimeout(timer)
    }, [open, popoverId])

    const language = i18n.resolvedLanguage ?? i18n.language
    if (formatScheduleEntries(schedule, t, language).length === 0) return null

    return (
        <div ref={rootRef} className="relative flex items-center gap-[6px]">
            <ClockIcon size={16} className="text-pink-400" />
            <span>{t('clubs.daysPerWeek', { count: countScheduleDays(schedule) })}</span>
            <button
                type="button"
                onClick={() => changeOpen(!open)}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-controls={popoverId}
                className="ml-2xs inline-flex items-center gap-2xs rounded font-semibold text-heading underline-offset-2 transition-colors hover:underline focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
                {t('clubs.showSchedule')}
                <ChevronDownIcon size={14} aria-hidden="true" className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <div className="absolute left-1/2 top-full z-30 flex w-0 justify-center">
                        <motion.div
                            {...dropdownMotion}
                            id={popoverId}
                            role="dialog"
                            aria-label={t('clubs.weeklySchedule')}
                            className="w-[min(360px,calc(92vw-44px))] shrink-0 pb-lg pt-sm"
                        >
                            <ClubScheduleCard schedule={schedule} className="shadow-lg" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default SchedulePopover
