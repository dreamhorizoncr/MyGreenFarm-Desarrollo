import { ClockIcon } from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'
import { dayName, formatScheduleEntries, parseSchedule, WEEK_DAYS } from '../utils/schedule.ts'

interface ClubScheduleCardProps {
    schedule: string | null | undefined
    className?: string
}

// Horario del club: semana con los días activos resaltados y una fila por cada franja horaria
function ClubScheduleCard({ schedule, className = '' }: Readonly<ClubScheduleCardProps>) {
    const { t, i18n } = useTranslation()
    const language = i18n.resolvedLanguage ?? i18n.language
    const entries = formatScheduleEntries(schedule, t, language)
    const activeDays = new Set(parseSchedule(schedule)?.flatMap((block) => block.days) ?? [])

    if (entries.length === 0) return null

    return (
        <div className={`rounded-2xl border border-neutral-200 bg-white p-lg text-left ${className || 'shadow-sm'}`}>
            <p className="m-0 flex items-center gap-sm font-heading text-h5 font-bold text-heading">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--pink-50)] text-pink-400">
                    <ClockIcon size={16} aria-hidden="true" />
                </span>
                {t('clubs.weeklySchedule')}
            </p>

            {activeDays.size > 0 && (
                <ul className="m-0 mt-md flex list-none justify-between gap-2xs p-0" aria-hidden="true">
                    {WEEK_DAYS.map((day) => (
                        <li
                            key={day}
                            title={dayName(day, language)}
                            className={`flex size-8 items-center justify-center rounded-full font-body text-caption font-semibold uppercase ${
                                activeDays.has(day) ? 'bg-green-500 text-white' : 'bg-neutral-100 text-neutral-400'
                            }`}
                        >
                            {dayName(day, language, 'narrow')}
                        </li>
                    ))}
                </ul>
            )}

            <ul className="m-0 mt-md flex list-none flex-col divide-y divide-neutral-100 p-0 font-body text-body-sm">
                {entries.map(({ days, hours }) => (
                    <li key={days} className="flex flex-col gap-2xs py-sm first:pt-0 last:pb-0">
                        <span className="font-semibold text-body-text-dark">{days}</span>
                        {hours && <span className="text-neutral-500">{hours}</span>}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ClubScheduleCard
