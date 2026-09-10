import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from './ui/Button.tsx'
import WizardSteps from './ui/WizardSteps.tsx'
import useDismiss from '../hooks/useDismiss.ts'
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

function ChangeAppointmentStatusModal({ appointment, onConfirm, onClose }: ChangeAppointmentStatusModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState(0)
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status)
  const [conclusion, setConclusion] = useState('')
  const [conclusionError, setConclusionError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

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

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === overlayRef.current) onClose()
  }

  const optionClassName = (active: boolean) =>
    `rounded-full px-md py-sm font-body text-sm font-semibold transition-colors ${
      active
        ? 'bg-green-500 text-white'
        : 'bg-[var(--grey-100)] text-body-text hover:bg-[var(--grey-200)]'
    }`

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-[min(620px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-label={t('teacherAppointments.changeStatus')}
      >
        <button
          type="button"
          className="absolute right-3 top-[26px] z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
          onClick={onClose}
          aria-label={t('admin.cancel')}
        >
          <X size={20} />
        </button>

        <div className="relative mb-lg text-center">
          <h2 className="m-0 font-heading text-[42px] font-bold leading-none text-heading">
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
              <p className="rounded-2xl border border-neutral-200 bg-[var(--grey-100)] px-md py-sm text-left font-body text-base leading-relaxed text-body-text">
                {t('booking.childName')}: <span className="font-bold">{appointment.childName}</span>
                {' · '}
                {t('teacherAppointments.date')}: <span className="font-bold">{formatDate(appointment.appointmentDate)}</span>
              </p>

              <div className="flex flex-col gap-sm">
                <label className="font-body text-base font-normal leading-[1.6] text-body-text">
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
                  <label htmlFor="change-status-conclusion" className="mb-1 font-body text-base font-normal leading-[1.6] text-body-text">
                    {t('teacherAppointments.rejectNoteLabel')}
                  </label>
                  <textarea
                    id="change-status-conclusion"
                    rows={4}
                    value={conclusion}
                    onChange={(e) => {
                      setConclusion(e.target.value)
                      if (conclusionError) setConclusionError(null)
                      if (saveError) setSaveError(null)
                    }}
                    placeholder={t('teacherAppointments.rejectNotePlaceholder')}
                    className="w-full resize-none border-b border-neutral-300 bg-transparent font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500 placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-55"
                  />
                  {conclusionError && (
                    <p className="mt-2xs text-left font-body text-sm text-danger">{conclusionError}</p>
                  )}
                </div>
              )}

              <div className="mt-sm flex gap-md">
                <Button variant="secondary" onClick={onClose} className="h-[47px] flex-1 font-body text-[17px]">
                  {t('admin.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={advanceToConfirm}
                  className="h-[47px] flex-1 bg-green-500 font-body text-[17px] font-normal text-white"
                >
                  {t('teacherAppointments.continue')}
                </Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="rounded-2xl border border-neutral-200 bg-[var(--grey-100)] px-md py-sm text-left font-body text-base leading-relaxed text-body-text">
                {t('teacherAppointments.confirmStatusQuestion', { child: appointment.childName, status: selectedStatusLabel })}
              </p>

              {saveError && (
                <p className="m-0 text-left font-body text-sm text-danger">{saveError}</p>
              )}

              <div className="mt-sm flex gap-md">
                <Button variant="secondary" onClick={() => setStep(0)} className="h-[47px] flex-1 font-body text-[17px]">
                  {t('teacherAppointments.back')}
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  loading={saving}
                  className="h-[47px] flex-1 bg-green-500 font-body text-[17px] font-normal text-white"
                >
                  {saving ? t('common.loading') : t('teacherAppointments.confirmAction')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChangeAppointmentStatusModal