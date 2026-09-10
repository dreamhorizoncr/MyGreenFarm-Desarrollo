import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import Button from './ui/Button.tsx'
import WizardSteps from './ui/WizardSteps.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import { appointmentService } from '../services/appointment.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { Appointment } from '../types/appointment.ts'

interface RescheduleAppointmentModalProps {
  appointment: Appointment
  onConfirm: (id: string, newDate: string) => Promise<void>
  onClose: () => void
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function todayISO(): string {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
}

function RescheduleAppointmentModal({ appointment, onConfirm, onClose }: RescheduleAppointmentModalProps) {
  const { t } = useTranslation()
  const overlayRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState(0)
  const [date, setDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useDismiss({
    ref: overlayRef,
    isOpen: true,
    onClose,
    includeClickOutside: false,
  })

  const loadSlots = async (dateStr: string) => {
    setSlotsLoading(true)
    setSlotsError(null)
    setSelectedSlot(null)
    try {
      const data = await appointmentService.getAvailableSlots(dateStr)
      setSlots(data)
    } catch (err) {
      setSlots([])
      setSlotsError(getErrorMessage(err))
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleDateChange = (next: string) => {
    setDate(next)
    if (next) void loadSlots(next)
  }

  const handleConfirm = async () => {
    if (!date || !selectedSlot) return
    const newDate = `${date}T${selectedSlot}:00`
    setSaving(true)
    setSaveError(null)
    try {
      await onConfirm(appointment.id, newDate)
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

  const slotSelected = (slot: string) => selectedSlot === slot.slice(0, 5)
  const slotClasses = (active: boolean) =>
    `rounded-full px-md py-sm font-body text-sm font-semibold transition-colors ${
      active
        ? 'bg-green-500 text-white'
        : 'bg-[var(--grey-100)] text-body-text hover:bg-[var(--grey-200)]'
    }`

  const dateLabel = formatDate(appointment.appointmentDate)
  const newDateTimeLabel = date && selectedSlot ? formatDate(`${date}T${selectedSlot}:00`) : ''

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
        aria-label={t('teacherAppointments.rescheduleTitle')}
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
            {t('teacherAppointments.rescheduleTitle')}
          </h2>
        </div>

        <div className="mb-lg px-[28px]">
          <WizardSteps
            steps={[t('teacherAppointments.stepChooseSchedule'), t('teacherAppointments.stepConfirm')]}
            current={step}
          />
        </div>

        <div className="flex flex-col gap-md px-[28px] pb-[32px] pt-[30px]">
          {step === 0 && (
            <>
              <p className="rounded-2xl border border-neutral-200 bg-[var(--grey-100)] px-md py-sm text-left font-body text-base leading-relaxed text-body-text">
                {t('teacherAppointments.rescheduleDescription', { child: appointment.childName, date: dateLabel })}
              </p>

              <div className="flex flex-col gap-sm">
                <label htmlFor="reschedule-appointment-date" className="font-body text-base font-normal leading-[1.6] text-body-text">
                  {t('teacherAppointments.rescheduleDateLabel')}
                </label>
                <input
                  id="reschedule-appointment-date"
                  type="date"
                  min={todayISO()}
                  value={date}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="h-[38px] w-full rounded-lg border border-neutral-200 bg-white px-md font-body text-[15px] text-body-text outline-none transition-colors focus:border-green-500"
                />

                {!date && (
                  <p className="m-0 text-left font-body text-body-sm text-neutral-500">
                    {t('teacherAppointments.rescheduleSelectDateHint')}
                  </p>
                )}

                {date && slotsLoading && (
                  <p className="m-0 text-left font-body text-body-sm text-neutral-500">
                    {t('teacherAppointments.rescheduleLoadingSlots')}
                  </p>
                )}

                {date && !slotsLoading && slotsError && (
                  <p className="m-0 text-left font-body text-body-sm text-danger">{slotsError}</p>
                )}

                {date && !slotsLoading && !slotsError && slots.length === 0 && (
                  <p className="m-0 text-left font-body text-body-sm text-neutral-500">
                    {t('teacherAppointments.rescheduleNoSlots')}
                  </p>
                )}

                {date && !slotsLoading && !slotsError && slots.length > 0 && (
                  <div className="grid grid-cols-3 gap-sm md:grid-cols-4">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        aria-pressed={slotSelected(slot)}
                        onClick={() => setSelectedSlot(slot.slice(0, 5))}
                        className={slotClasses(slotSelected(slot))}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {saveError && (
                <p className="m-0 text-left font-body text-sm text-danger">{saveError}</p>
              )}

              <div className="mt-sm flex gap-md">
                <Button variant="secondary" onClick={onClose} className="h-[47px] flex-1 font-body text-[17px]">
                  {t('admin.cancel')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setStep(1)}
                  disabled={!date || !selectedSlot}
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
                {t('teacherAppointments.confirmRescheduleQuestion', { child: appointment.childName, dateTime: newDateTimeLabel })}
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
                  {saving ? t('common.loading') : t('teacherAppointments.rescheduleAction')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RescheduleAppointmentModal