import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import WizardSteps from './ui/WizardSteps.tsx'
import { getErrorMessage } from '../utils/error.ts'
import { validateRequired } from '../utils/validators.ts'
import type { Appointment, AppointmentStatus } from '../types/appointment.ts'

const STATUS_OPTIONS: AppointmentStatus[] = ['PENDING', 'CONFIRMED', 'CANCELLED']

interface ChangeAppointmentStatusModalProps {
  appointment: Appointment
  onConfirm: (id: string, status: AppointmentStatus, conclusion?: string) => Promise<void>
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function ChangeAppointmentStatusModal({ appointment, onConfirm, onClose }: Readonly<ChangeAppointmentStatusModalProps>) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status)
  const [conclusion, setConclusion] = useState('')
  const [conclusionError, setConclusionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const requiresConclusion = status === 'CANCELLED'
  const selectedStatusLabel = t(`teacherAppointments.status.${status.toLowerCase()}` as 'teacherAppointments.status.pending')

  const advanceToConfirm = () => {
    if (requiresConclusion) {
      const message = validateRequired(conclusion, t('teacherAppointments.rejectNoteLabel'), t)
      setConclusionError(message)
      if (message) return
    }
    setSaveError(null)
    setStep(1)
  }

  const handleConfirm = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await onConfirm(appointment.id, status, requiresConclusion ? conclusion.trim() : undefined)
      onClose()
    } catch (err) {
      setSaveError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const optionClassName = (active: boolean) =>
    `rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors ${
      active
        ? 'border-green-500 bg-green-500 text-white'
        : 'border-green-500 bg-white text-heading hover:bg-green-50'
    }`

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
      aria-label={t('teacherAppointments.changeStatus')}
      className="m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none scrollbar-none overflow-y-auto rounded-2xl bg-bg-card backdrop:bg-scrim animate-[modal-in_0.2s_ease-out]"
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

        <div className="relative mb-lg text-center">
          <h2 className="m-0 font-heading text-h1 font-bold leading-none text-heading">
            {t('teacherAppointments.changeStatus')}
          </h2>
        </div>

        <div className="mb-lg px-[28px]">
          <WizardSteps
            steps={[t('teacherAppointments.stepChooseStatus'), t('teacherAppointments.stepConfirm')]}
            current={step}
          />
        </div>

        <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
          {step === 0 && (
            <>
              <p className="rounded-2xl border border-neutral-200 bg-[var(--grey-100)] px-md py-sm text-left font-body text-body leading-relaxed text-body-text">
                {t('booking.childName')}: <span className="font-bold">{appointment.childName}</span>
                {' · '}
                {t('teacherAppointments.date')}: <span className="font-bold">{formatDate(appointment.appointmentDate)}</span>
              </p>

              <div className="flex flex-col gap-sm">
                <label className="font-body text-body font-normal leading-[1.6] text-body-text">
                  {t('teacherAppointments.state')}
                </label>
                <div className="flex flex-wrap gap-sm">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={status === option}
                      onClick={() => {
                        setStatus(option)
                        setSaveError(null)
                        if (option === 'CANCELLED') setConclusionError(null)
                      }}
                      className={optionClassName(status === option)}
                    >
                      {t(`teacherAppointments.status.${option.toLowerCase()}` as 'teacherAppointments.status.pending')}
                    </button>
                  ))}
                </div>
              </div>

              {requiresConclusion && (
                <div className="flex flex-col">
                  <label htmlFor="change-status-conclusion" className="mb-1 font-body text-body font-normal leading-[1.6] text-body-text">
                    {t('teacherAppointments.rejectNoteLabel')}
                  </label>
                  <textarea
                    id="change-status-conclusion"
                    rows={4}
                    value={conclusion}
                    maxLength={4000}
                    onChange={(e) => {
                      setConclusion(e.target.value)
                      if (conclusionError) setConclusionError(null)
                      if (saveError) setSaveError(null)
                    }}
                    placeholder={t('teacherAppointments.rejectNotePlaceholder')}
                    className="w-full resize-none border-b border-neutral-300 bg-transparent font-body text-body-sm text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-55"
                  />
                  {conclusionError && (
                    <p className="mt-2xs text-left font-body text-body-sm text-danger">{conclusionError}</p>
                  )}
                </div>
              )}

              <div className="mt-sm flex gap-md">
                <Button variant="secondary" onClick={onClose} className="h-11 flex-1 border-green-500 font-body text-button text-heading hover:bg-green-50">
                  {t('admin.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={advanceToConfirm}
                  className="h-11 flex-1 bg-orange-500 font-body text-button font-normal text-white hover:bg-orange-600"
                >
                  {t('teacherAppointments.continue')}
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="rounded-2xl border border-neutral-200 bg-[var(--grey-100)] px-md py-sm text-left font-body text-body leading-relaxed text-body-text">
                {t('teacherAppointments.confirmStatusQuestion', { child: appointment.childName, status: selectedStatusLabel })}
              </p>

              {saveError && (
                <p className="m-0 text-left font-body text-body-sm text-danger">{saveError}</p>
              )}

              <div className="mt-sm flex gap-md">
                <Button variant="secondary" onClick={() => setStep(0)} className="h-11 flex-1 border-green-500 font-body text-button text-heading hover:bg-green-50">
                  {t('teacherAppointments.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  loading={saving}
                  className="h-11 flex-1 bg-orange-500 font-body text-button font-normal text-white hover:bg-orange-600"
                >
                  {saving ? t('common.loading') : t('teacherAppointments.confirmAction')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </dialog>
  )
}

export default ChangeAppointmentStatusModal