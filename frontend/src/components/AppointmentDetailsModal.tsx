import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import { formatPhoneNumberIntl } from 'react-phone-number-input'
import useDismiss from '../hooks/useDismiss.ts'
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

function AppointmentDetailsModal({ appointment, onClose }: AppointmentDetailsModalProps) {
  const { t, i18n } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)
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

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="relative max-h-[90vh] w-[min(720px,92vw)] overflow-y-auto scrollbar-none rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-details-title"
      >
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <XIcon size={20} />
        </button>

        <div className="mb-lg px-[28px] pr-10">
          <span className="inline-flex rounded-full px-sm py-2xs font-body text-xs font-semibold text-body-text bg-[var(--grey-100)]">
            {statusLabel}
          </span>
          <h2 id="appointment-details-title" className="m-0 mt-sm font-heading text-[30px] font-bold leading-tight text-heading">
            {appointment.childName}
          </h2>
          <p className="m-0 mt-2xs font-body text-[15px] text-neutral-500">{appointmentDate}</p>
        </div>

        <dl className="grid grid-cols-1 gap-x-lg gap-y-md px-[28px] sm:grid-cols-2">
          {infoRows.map(({ label, value }) => (
            <div key={label}>
              <dt className="font-body text-xs font-semibold uppercase tracking-[0.4px] text-neutral-default">{label}</dt>
              <dd className="m-0 mt-2xs break-words font-body text-[15px] leading-6 text-body-text">{value || '—'}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="font-body text-xs font-semibold uppercase tracking-[0.4px] text-neutral-default">{t('booking.reason')}</dt>
            <dd className="m-0 mt-2xs whitespace-pre-wrap break-words font-body text-[15px] leading-6 text-body-text">{appointment.parentNotes || '—'}</dd>
          </div>
          {appointment.status === 'CANCELLED' && (
            <div className="sm:col-span-2">
              <dt className="font-body text-xs font-semibold uppercase tracking-[0.4px] text-neutral-default">{t('teacherAppointments.conclusion')}</dt>
              <dd className="m-0 mt-2xs whitespace-pre-wrap break-words font-body text-[15px] leading-6 text-body-text">{appointment.teacherConclusion || '—'}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  )
}

export default AppointmentDetailsModal
