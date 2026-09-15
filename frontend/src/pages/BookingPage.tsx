import { useCallback, useEffect, useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, CheckIcon } from '@animateicons/react/lucide'
import PhoneInput from 'react-phone-number-input'
import { useNavigate } from 'react-router-dom'
import 'react-phone-number-input/style.css'
import BookingSuccessModal from '../components/BookingSuccessModal.tsx'
import Navbar from '../components/Navbar.tsx'
import TextField from '../components/ui/TextField.tsx'
import { useBooking } from '../hooks/useBooking.ts'
import {
  validateEmail,
  validateIdNumber,
  validatePhoneNumber,
  validateRequired,
} from '../utils/validators.ts'

function BookingPhoneInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-[38px] w-full border-b border-neutral-300 bg-transparent pl-2 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
    />
  )
}

const WEEKDAY_BOOKING_KEYS: Record<
  number,
  'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | null
> = {
  0: null,
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: null,
}

function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getNextMonday(): Date {
  const today = new Date()
  const daysUntilMonday = ((8 - today.getDay()) % 7) || 7
  const nextMonday = new Date(today)
  nextMonday.setDate(today.getDate() + daysUntilMonday)
  return nextMonday
}

type Slot = { start: string }

const ID_TYPES = ['Costarricense', 'Extranjero']

function parseSlots(slots: string[]): Slot[] {
  return slots.map((slot) => ({ start: slot.slice(0, 5) }))
}

const STEPS = [
  { key: 'schedule', label: 'booking.wizard.schedule' },
  { key: 'child', label: 'booking.wizard.child' },
  { key: 'applicant', label: 'booking.wizard.applicant' },
  { key: 'confirm', label: 'booking.wizard.confirm' },
]

function BookingPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const {
    availability,
    slotsLoading,
    slotsError,
    submitting,
    submitError,
    success,
    fetchWeek,
    submit,
    setSuccess,
  } = useBooking()

  const [step, setStep] = useState(1)

  const [fullName, setFullName] = useState('')
  const [idType, setIdType] = useState('Costarricense')
  const [idNumber, setIdNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phoneCountry, setPhoneCountry] = useState<string | undefined>(undefined)
  const [phone, setPhone] = useState('')
  const [occupation, setOccupation] = useState('')
  const [childName, setChildName] = useState('')
  const [reason, setReason] = useState('')
  const [day, setDay] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)

  const [fullNameError, setFullNameError] = useState(false)
  const [idNumberError, setIdNumberError] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [occupationError, setOccupationError] = useState(false)
  const [childNameError, setChildNameError] = useState(false)
  const [reasonError, setReasonError] = useState(false)

  useEffect(() => {
    fetchWeek(toISODate(getNextMonday()))
  }, [fetchWeek])

  const availableDates = Object.keys(availability)
  const effectiveDay = day ?? availableDates[0] ?? null
  const effectiveTime =
    time ??
    (effectiveDay ? availability[effectiveDay]?.[0]?.slice(0, 5) ?? null : null)
  const selectedDaySlots = effectiveDay ? availability[effectiveDay] : []
  const morningSlots = selectedDaySlots ? parseSlots(selectedDaySlots.filter((slot) => Number(slot.slice(0, 2)) < 12)) : []
  const afternoonSlots = selectedDaySlots ? parseSlots(selectedDaySlots.filter((slot) => Number(slot.slice(0, 2)) >= 12)) : []

  const handlePhoneChange = (value?: string) => {
    const next = value ?? ''
    setPhone(next)
    setPhoneError(validatePhoneNumber(next, t) !== null)
  }

  const handleCountryChange = (country?: string) => {
    setPhoneCountry(country)
    if (!country) {
      setPhoneError(true)
    } else {
      setPhoneError(phone ? validatePhoneNumber(phone, t) !== null : false)
    }
  }

  const handlePhoneBlur = () => {
    if (!phoneCountry || !phone.trim()) setPhoneError(true)
  }

  const selectDay = (date: string) => {
    setDay(date)
    const firstSlot = availability[date]?.[0]
    setTime(firstSlot ? firstSlot.slice(0, 5) : null)
  }

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      return effectiveDay !== null && effectiveTime !== null
    }
    if (currentStep === 2) {
      const childNameValid = validateRequired(childName, t('booking.childName'), t) === null
      const reasonValid = validateRequired(reason, t('booking.reason'), t) === null
      if (!childNameValid) setChildNameError(true)
      if (!reasonValid) setReasonError(true)
      return childNameValid && reasonValid
    }
    if (currentStep === 3) {
      const fullNameValid = validateRequired(fullName, t('booking.fullName'), t) === null
      const idNumberValid = validateRequired(idNumber, t('booking.idNumber'), t) === null && validateIdNumber(idNumber, idType, t) === null
      const emailValid = validateRequired(email, t('booking.email'), t) === null && validateEmail(email, t) === null
      const phoneValid = phoneCountry
        ? validateRequired(phone, t('booking.phone'), t) === null && validatePhoneNumber(phone, t) === null
        : false
      const occupationValid = validateRequired(occupation, t('booking.occupation'), t) === null
      if (!fullNameValid) setFullNameError(true)
      if (!idNumberValid) setIdNumberError(true)
      if (!emailValid) setEmailError(true)
      if (!phoneValid) setPhoneError(true)
      if (!occupationValid) setOccupationError(true)
      return fullNameValid && idNumberValid && emailValid && phoneValid && occupationValid
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(step) && step < 4) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (!effectiveDay || !effectiveTime) return

    const ok = await submit({
      idType,
      parentIdentification: idNumber,
      parentName: fullName,
      parentEmail: email,
      parentPhone: phone,
      parentOccupation: occupation,
      childName,
      appointmentDate: `${effectiveDay}T${effectiveTime}:00`,
      parentNotes: reason,
      language: (i18n.language ?? 'es').split('-')[0],
    })
    if (ok) resetForm()
  }

  const resetForm = useCallback(() => {
    setStep(1)
    setFullName('')
    setIdType('Costarricense')
    setIdNumber('')
    setEmail('')
    setPhoneCountry(undefined)
    setPhone('')
    setOccupation('')
    setChildName('')
    setReason('')
    setDay(null)
    setTime(null)
    setFullNameError(false)
    setIdNumberError(false)
    setEmailError(false)
    setPhoneError(false)
    setOccupationError(false)
    setChildNameError(false)
    setReasonError(false)
  }, [])

  const selectableClassName = (active: boolean) =>
    `rounded-full px-md py-sm font-body text-sm font-semibold transition-colors ${
      active
        ? 'bg-green-500 text-white'
        : 'bg-[var(--grey-100)] text-body-text hover:bg-[var(--grey-200)]'
    }`

  const fullNameErrorMessage = fullNameError
    ? validateRequired(fullName, t('booking.fullName'), t)
    : null
  const idNumberErrorMessage = idNumberError
    ? validateRequired(idNumber, t('booking.idNumber'), t) ??
      validateIdNumber(idNumber, idType, t)
    : null
  const emailErrorMessage = emailError
    ? validateRequired(email, t('booking.email'), t) ?? validateEmail(email, t)
    : null
  const phoneErrorMessage = phoneError
    ? phoneCountry
      ? validateRequired(phone, t('booking.phone'), t) ??
        validatePhoneNumber(phone, t)
      : t('validation.countryRequired')
    : null
  const occupationErrorMessage = occupationError
    ? validateRequired(occupation, t('booking.occupation'), t)
    : null
  const childNameErrorMessage = childNameError
    ? validateRequired(childName, t('booking.childName'), t)
    : null
  const reasonErrorMessage = reasonError
    ? validateRequired(reason, t('booking.reason'), t)
    : null

  const dayLabel = (date: string) => {
    const parsed = new Date(`${date}T12:00:00`)
    const weekdayKey = WEEKDAY_BOOKING_KEYS[parsed.getDay()]
    if (!weekdayKey) return date
    const dayShort = String(parsed.getDate()).padStart(2, '0')
    const monthShort = String(parsed.getMonth() + 1).padStart(2, '0')
    return `${t(`booking.days.${weekdayKey}`)} ${dayShort}/${monthShort}`
  }

  const renderSlots = (slots: Slot[]) =>
    slots.length > 0 ? (
      <div className="grid grid-cols-3 gap-sm md:grid-cols-4">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            aria-pressed={effectiveTime === slot.start}
            onClick={() => setTime(slot.start)}
            className={selectableClassName(effectiveTime === slot.start)}
          >
            {slot.start}
          </button>
        ))}
      </div>
    ) : (
      <p className="m-0 text-left font-body text-body-sm text-body-text">
        {t('booking.noSlots')}
      </p>
    )

  const renderStepSchedule = () => (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm">
        <h3 className="m-0 text-left font-heading text-h4 font-bold text-heading">
          {t('booking.scheduleTitle')}
        </h3>
        <p className="m-0 text-left font-body text-body-sm text-body-text">
          {t('booking.scheduleDescription')}
        </p>
      </div>

      {slotsLoading && (
        <p className="m-0 text-left font-body text-body-sm text-body-text">
          {t('booking.loadingSlots')}
        </p>
      )}

      {!slotsLoading && slotsError && (
        <div className="flex flex-col gap-sm">
          <p className="m-0 text-left font-body text-body-sm text-danger">
            {slotsError}
          </p>
          <button
            type="button"
            onClick={() => fetchWeek(toISODate(getNextMonday()))}
            className="w-fit rounded-full bg-green-500 px-lg py-sm font-body text-sm font-semibold text-white transition-colors hover:bg-green-600"
          >
            {t('booking.retry')}
          </button>
        </div>
      )}

      {!slotsLoading && !slotsError && availableDates.length === 0 && (
        <p className="m-0 text-left font-body text-body-sm text-body-text">
          {t('booking.noSlots')}
        </p>
      )}

      {!slotsLoading && !slotsError && availableDates.length > 0 && (
        <>
          <div className="flex flex-wrap gap-sm">
            {availableDates.map((date) => (
              <button
                key={date}
                type="button"
                aria-pressed={effectiveDay === date}
                onClick={() => selectDay(date)}
                className={selectableClassName(effectiveDay === date)}
              >
                {dayLabel(date)}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-sm">
            <h4 className="m-0 text-left font-body text-base font-bold text-body-text">
              {t('booking.morning')}
            </h4>
            {renderSlots(morningSlots)}
          </div>

          <div className="flex flex-col gap-sm">
            <h4 className="m-0 text-left font-body text-base font-bold text-body-text">
              {t('booking.afternoon')}
            </h4>
            {renderSlots(afternoonSlots)}
          </div>
        </>
      )}
    </div>
  )

  const renderStepChild = () => (
    <div className="flex flex-col gap-[18px]">
      <h3 className="m-0 text-left font-heading text-h4 font-bold text-heading">
        {t('booking.wizard.childTitle')}
      </h3>
      <TextField
        id="booking-child"
        label={t('booking.childName')}
        value={childName}
        onChange={(e) => {
          setChildName(e.target.value)
          if (childNameError) setChildNameError(false)
        }}
        error={childNameErrorMessage}
      />
      <TextField
        id="booking-reason"
        label={t('booking.reason')}
        error={reasonErrorMessage}
      >
        <textarea
          id="booking-reason"
          value={reason}
          maxLength={4000}
          onChange={(e) => {
            setReason(e.target.value)
            if (reasonError) setReasonError(false)
          }}
          rows={3}
          className="w-full resize-none border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
        />
      </TextField>
    </div>
  )

  const renderStepApplicant = () => (
    <div className="flex flex-col gap-[18px]">
      <h3 className="m-0 text-left font-heading text-h4 font-bold text-heading">
        {t('booking.wizard.applicantTitle')}
      </h3>
      <div className="grid grid-cols-2 gap-x-[18px] gap-y-[14px]">
        <div className="col-span-2">
          <TextField
            id="booking-name"
            label={t('booking.fullName')}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              if (fullNameError) setFullNameError(false)
            }}
            error={fullNameErrorMessage}
          />
        </div>
        <div className="col-span-1">
          <div className="flex flex-col gap-sm">
            <label className="mb-[4px] block text-left font-body text-[16px] text-body-text">
              {t('booking.idType')}
            </label>
            <div className="flex flex-wrap gap-sm">
              {ID_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={idType === option}
                  onClick={() => {
                    setIdType(option)
                    setIdNumberError(
                      idNumber ? validateIdNumber(idNumber, option, t) !== null : false,
                    )
                  }}
                  className={selectableClassName(idType === option)}
                >
                  {t(`booking.idTypeOptions.${option.toLowerCase()}` as 'booking.idTypeOptions.costarricense')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-1">
          <TextField
            id="booking-id"
            label={t('booking.idNumber')}
            value={idNumber}
            onChange={(e) => {
              const next = e.target.value
              setIdNumber(next)
              setIdNumberError(validateIdNumber(next, idType, t) !== null)
            }}
            error={idNumberErrorMessage}
          />
        </div>
        <div className="col-span-1">
          <TextField
            id="booking-email"
            type="email"
            label={t('booking.email')}
            value={email}
            onChange={(e) => {
              const next = e.target.value
              setEmail(next)
              setEmailError(next ? validateEmail(next, t) !== null : false)
            }}
            error={emailErrorMessage}
          />
        </div>
        <div className="col-span-1">
          <TextField
            id="booking-phone"
            label={t('booking.phone')}
            error={phoneErrorMessage}
          >
            <PhoneInput
              id="booking-phone"
              className="h-[38px]"
              value={phone}
              onChange={handlePhoneChange}
              onCountryChange={handleCountryChange}
              onBlur={handlePhoneBlur}
              inputComponent={BookingPhoneInput}
            />
          </TextField>
        </div>
        <div className="col-span-2">
          <TextField
            id="booking-occupation"
            label={t('booking.occupation')}
            value={occupation}
            onChange={(e) => {
              setOccupation(e.target.value)
              if (occupationError) setOccupationError(false)
            }}
            error={occupationErrorMessage}
          />
        </div>
      </div>
    </div>
  )

  const renderStepConfirm = () => (
    <div className="flex flex-col gap-lg">
      <h3 className="m-0 text-left font-heading text-h4 font-bold text-heading">
        {t('booking.wizard.confirmTitle')}
      </h3>

      <div className="flex flex-col gap-md rounded-xl bg-[var(--grey-100)] p-md">
        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.wizard.schedule')}</span>
          <span className="font-body text-sm font-semibold text-heading">
            {effectiveDay && dayLabel(effectiveDay)} - {effectiveTime}
          </span>
        </div>

        <div className="h-px bg-neutral-300" />

        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.childName')}</span>
          <span className="font-body text-sm font-semibold text-heading">{childName}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.reason')}</span>
          <span className="font-body text-sm text-heading">{reason}</span>
        </div>

        <div className="h-px bg-neutral-300" />

        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.fullName')}</span>
          <span className="font-body text-sm font-semibold text-heading">{fullName}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.idNumber')}</span>
          <span className="font-body text-sm text-heading">{idType} - {idNumber}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.occupation')}</span>
          <span className="font-body text-sm text-heading">{occupation}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.email')}</span>
          <span className="font-body text-sm text-heading">{email}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.phone')}</span>
          <span className="font-body text-sm text-heading">{phone}</span>
        </div>
      </div>

      {submitError && (
        <p className="m-0 text-center font-body text-sm text-danger">
          {submitError}
        </p>
      )}
    </div>
  )

  const stepContents: Record<number, () => React.ReactNode> = {
    1: renderStepSchedule,
    2: renderStepChild,
    3: renderStepApplicant,
    4: renderStepConfirm,
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />

      <main className="flex items-center justify-center px-[30px] py-[30px] md:px-6 md:py-10">
        <section className="relative flex w-full max-w-[333px] flex-col overflow-hidden rounded-[13px] bg-bg-card shadow md:h-[630px] md:max-w-[1000px] md:flex-row md:rounded-2xl">

          {/* Panel izquierdo: Wizard */}
          <div className="flex w-full flex-col px-[30px] pb-[28px] pt-[40px] md:w-[55%] md:px-[50px] md:py-[40px]">
            {/* Header */}
            <div className="mb-lg flex items-center gap-sm">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-heading focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2"
                aria-label={t('booking.back')}
              >
                <ArrowLeftIcon size={30} aria-hidden="true" />
              </button>
              <h2 className="m-0 text-left font-heading text-[28px] leading-none text-heading md:text-[36px]">
                {t('booking.title')}
              </h2>
            </div>

            {/* Progress indicator */}
            <div className="mb-lg flex items-center gap-sm">
              {STEPS.map((s, i) => {
                const stepNum = i + 1
                const isActive = step === stepNum
                const isCompleted = step > stepNum
                return (
                  <div key={s.key} className="flex items-center gap-sm">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full font-body text-sm font-semibold transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                            ? 'bg-green-500/20 text-green-600 ring-2 ring-green-500'
                            : 'bg-[var(--grey-100)] text-body-text'
                      }`}
                    >
                      {isCompleted ? <CheckIcon size={16} /> : stepNum}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`h-0.5 w-6 transition-colors ${
                          step > stepNum ? 'bg-green-500' : 'bg-[var(--grey-100)]'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Step content */}
            <div className="flex-1 overflow-y-auto">
              {stepContents[step]()}
            </div>

            {/* Navigation buttons */}
            <div className="mt-lg flex items-center justify-between gap-sm">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-xs rounded-full border border-neutral-300 px-md py-sm font-body text-sm font-semibold text-heading transition-colors hover:bg-[var(--grey-100)]"
                >
                  <ArrowLeftIcon size={16} />
                  {t('booking.wizard.back')}
                </button>
              ) : (
                <div />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-xs rounded-full bg-green-500 px-lg py-sm font-body text-sm font-semibold text-white transition-colors hover:bg-green-600"
                >
                  {t('booking.wizard.next')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-xs rounded-full bg-green-500 px-lg py-sm font-body text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-[var(--grey-600)] disabled:hover:bg-[var(--grey-600)]"
                >
                  {submitting ? t('booking.submitting') : t('booking.wizard.confirm')}
                  <CheckIcon size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Panel derecho: Ilustración / Branding */}
          <div className="hidden bg-gradient-to-br from-green-500 to-green-600 md:flex md:w-[45%] md:flex-col md:items-center md:justify-center md:p-xl">
            <div className="flex flex-col items-center gap-lg text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-white/20">
                <CheckIcon size={32} className="text-white" />
              </div>
              <div className="flex flex-col gap-sm">
                <h3 className="m-0 font-heading text-[24px] font-bold text-white">
                  {t('booking.wizard.heroTitle')}
                </h3>
                <p className="m-0 max-w-[280px] font-body text-sm text-white/80">
                  {t('booking.wizard.heroDescription')}
                </p>
              </div>
            </div>
          </div>

        </section>

        {success && <BookingSuccessModal onClose={() => setSuccess(false)} />}
      </main>
    </div>
  )
}

export default BookingPage
