import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatPhoneNumberIntl } from 'react-phone-number-input'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import { appointmentService } from '../services/appointment.ts'
import type { Appointment } from '../types/appointment.ts'
import ModalCloseButton from './ui/ModalCloseButton.tsx'

interface AppointmentDetailsModalProps {
  appointment: Appointment
  onClose: () => void
}

const TRANSLATABLE_FIELDS = ['parentOccupation', 'parentNotes', 'teacherConclusion'] as const
const TRANSLATION_ENTITY_TYPE = 'APPOINTMENT'

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
  const { closing, requestClose } = useModalExit(onClose)
  useDialogDismiss(dialogRef, requestClose)
  const locale = i18n.resolvedLanguage ?? i18n.language ?? 'es'
  const [translations, setTranslations] = useState<Record<string, string>>({})

  useEffect(() => {
    const items = TRANSLATABLE_FIELDS.flatMap((field) => {
      const originalText = appointment[field]
      return originalText ? [{ entityId: appointment.id, fieldName: field, originalText }] : []
    })
    if (items.length === 0) return
    let cancelled = false
    appointmentService.translateBatch(TRANSLATION_ENTITY_TYPE, locale.split('-')[0], items)
      .then((result) => {
        if (!cancelled) setTranslations(result)
      })
      .catch(() => {
        // Si falla la traducción se muestra el texto original.
      })
    return () => {
      cancelled = true
    }
  }, [appointment, locale])

  const text = (field: (typeof TRANSLATABLE_FIELDS)[number]) => translations[`${appointment.id}:${field}`] ?? appointment[field]
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
    { label: t('booking.occupation'), value: text('parentOccupation') },
  ]

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={requestClose}
      aria-labelledby="appointment-details-title"
      className={`text-left fixed inset-0 m-auto max-h-[90vh] w-[min(720px,92vw)] max-w-none modal-scroll rounded-[20px] bg-bg-card backdrop:bg-scrim ${closing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
    >
      <div className="relative p-lg md:p-xl">
        <div className="mb-lg flex items-start justify-between gap-md">
          <div className="min-w-0">
            <span className="inline-flex rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
              {statusLabel}
            </span>
            <h2 id="appointment-details-title" className="m-0 mt-sm font-heading text-h4 font-bold leading-tight text-heading">
              {appointment.childName}
            </h2>
            <p className="m-0 mt-2xs font-body text-body-sm text-neutral-500">{appointmentDate}</p>
          </div>
          <ModalCloseButton onClick={requestClose} aria-label={t('admin.cancel')} />
        </div>

        <dl className="grid grid-cols-1 gap-x-lg gap-y-md sm:grid-cols-2">
          {infoRows.map(({ label, value }) => (
            <div key={label}>
              <dt className="font-body text-caption font-semibold uppercase tracking-[0.4px] text-neutral-default">{label}</dt>
              <dd className="m-0 mt-2xs break-words font-body text-body-sm leading-6 text-body-text">{value || '—'}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="font-body text-caption font-semibold uppercase tracking-[0.4px] text-neutral-default">{t('booking.reason')}</dt>
            <dd className="m-0 mt-2xs whitespace-pre-wrap break-words font-body text-body-sm leading-6 text-body-text">{text('parentNotes') || '—'}</dd>
          </div>
          {appointment.status === 'CANCELLED' && (
            <div className="sm:col-span-2">
              <dt className="font-body text-caption font-semibold uppercase tracking-[0.4px] text-neutral-default">{t('teacherAppointments.conclusion')}</dt>
              <dd className="m-0 mt-2xs whitespace-pre-wrap break-words font-body text-body-sm leading-6 text-body-text">{text('teacherConclusion') || '—'}</dd>
            </div>
          )}
        </dl>
      </div>
    </dialog>
  )
}

export default AppointmentDetailsModal
