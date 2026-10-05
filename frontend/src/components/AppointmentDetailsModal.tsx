import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import { formatPhoneNumberIntl } from 'react-phone-number-input'
import type { Appointment } from '../types/appointment.ts'

interface AppointmentDetailsModalProps {
  appointment: Appointment
  onClose: () => void
}

function formatPhone(phone: string) {
  if (!phone) return phone
  try {
    return formatPhoneNumberIntl(phone)
  } catch {
    return phone
  }
}

function AppointmentDetailsModal({ appointment, onClose }: Readonly<AppointmentDetailsModalProps>) {
  const { t, i18n } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  const appointmentDate = new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(appointment.appointmentDate))
  const statusLabel = t(
    `teacherAppointments.status.${appointment.status.toLowerCase()}` as 'teacherAppointments.status.pending',
  )
  const infoRows = [
    { label: t('booking.fullName'), value: appointment.parentName },
    { label: t('booking.idNumber'), value: appointment.parentIdentification },
    { label: t('booking.email'), value: appointment.parentEmail },
    { label: t('booking.phone'), value: formatPhone(appointment.parentPhone) },
    { label: t('booking.occupation'), value: appointment.parentOccupation },
  ]

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
      aria-labelledby="appointment-details-title"
      className="fixed inset-0 m-auto max-h-[90vh] w-[min(720px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
    >
      <div className="relative p-[28px_22px_30px]">
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        <div className="mb-lg px-[28px] pr-10">
          <span className="inline-flex rounded-full px-sm py-2xs font-body text-caption font-semibold text-body-text bg-[var(--grey-100)]">
            {statusLabel}
          </span>
          <h2 id="appointment-details-title" className="m-0 mt-sm font-heading text-[30px] font-bold leading-tight text-heading">
            {appointment.childName}
          </h2>
          <p className="m-0 mt-2xs font-body text-body-sm text-neutral-500">{appointmentDate}</p>
        </div>

        <dl className="grid grid-cols-1 gap-x-lg gap-y-md px-[28px] sm:grid-cols-2">
          {infoRows.map(({ label, value }) => (
            <div key={label}>
              <dt className="font-body text-caption font-semibold uppercase tracking-[0.4px] text-neutral-default">{label}</dt>
              <dd className="m-0 mt-2xs break-words font-body text-body-sm leading-6 text-body-text">{value || '—'}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="font-body text-caption font-semibold uppercase tracking-[0.4px] text-neutral-default">{t('booking.reason')}</dt>
            <dd className="m-0 mt-2xs whitespace-pre-wrap break-words font-body text-body-sm leading-6 text-body-text">{appointment.parentNotes || '—'}</dd>
          </div>
          {appointment.status === 'CANCELLED' && (
            <div className="sm:col-span-2">
              <dt className="font-body text-caption font-semibold uppercase tracking-[0.4px] text-neutral-default">{t('teacherAppointments.conclusion')}</dt>
              <dd className="m-0 mt-2xs whitespace-pre-wrap break-words font-body text-body-sm leading-6 text-body-text">{appointment.teacherConclusion || '—'}</dd>
            </div>
          )}
        </dl>
      </div>
    </dialog>
  )
}

export default AppointmentDetailsModal
