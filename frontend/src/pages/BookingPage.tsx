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
import { notify } from '../utils/notifications.ts'
import {
  validateEmail,
  validateIdNumber,
  validatePhoneNumber,
  validateRequired,
} from '../utils/validators.ts'
import type { ReferralSource } from '../types/appointment.ts'

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

function isBookableWeekday(date: string): boolean {
  const day = new Date(`${date}T12:00:00`).getDay()
  return day >= 1 && day <= 5
}

function getTomorrow(): Date {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  return tomorrow
}

type Slot = { start: string }

const ID_TYPES = ['Costarricense', 'Extranjero']
const REFERRAL_SOURCES: ReferralSource[] = ['FRIEND', 'SOCIAL_MEDIA', 'GOOGLE_SEARCH', 'FLYER_OR_AD', 'OTHER']

function parseSlots(slots: string[]): Slot[] {
  return slots.map((slot) => ({ start: slot.slice(0, 5) }))
}

const STEPS = [
  { key: 'schedule', label: 'booking.wizard.schedule' },
  { key: 'child', label: 'booking.wizard.child' },
  { key: 'identity', label: 'booking.wizard.identity' },
  { key: 'contact', label: 'booking.wizard.contact' },
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
  const [referralSource, setReferralSource] = useState<ReferralSource | ''>('')
  const [referralOtherDetail, setReferralOtherDetail] = useState('')
  const [day, setDay] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)

  const [fullNameError, setFullNameError] = useState(false)
  const [idNumberError, setIdNumberError] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [occupationError, setOccupationError] = useState(false)
  const [childNameError, setChildNameError] = useState(false)
  const [reasonError, setReasonError] = useState(false)
  const [referralSourceError, setReferralSourceError] = useState(false)
  const [referralOtherDetailError, setReferralOtherDetailError] = useState(false)

  useEffect(() => {
    fetchWeek(toISODate(getTomorrow()))
  }, [fetchWeek])

  const availableDates = Object.keys(availability).filter(isBookableWeekday)
  const effectiveDay = day && availableDates.includes(day) ? day : availableDates[0] ?? null
  const effectiveTime =
    time ??
    (effectiveDay ? availability[effectiveDay]?.slots[0]?.slice(0, 5) ?? null : null)
  const selectedDay = effectiveDay ? availability[effectiveDay] : null
  const selectedDaySlots = selectedDay?.slots ?? []
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
    const firstSlot = availability[date]?.slots[0]
    setTime(firstSlot ? firstSlot.slice(0, 5) : null)
  }

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      return effectiveDay !== null && effectiveTime !== null
    }
    if (currentStep === 2) {
      const childNameValid = validateRequired(childName, t('booking.childName'), t) === null
      const reasonValid = validateRequired(reason, t('booking.reason'), t) === null
      const referralSourceValid = referralSource !== ''
      const referralOtherDetailValid = referralSource !== 'OTHER' || validateRequired(referralOtherDetail, t('booking.referral.otherDetail'), t) === null
      if (!childNameValid) setChildNameError(true)
      if (!reasonValid) setReasonError(true)
      if (!referralSourceValid) setReferralSourceError(true)
      if (!referralOtherDetailValid) setReferralOtherDetailError(true)
      return childNameValid && reasonValid && referralSourceValid && referralOtherDetailValid
    }
    if (currentStep === 3) {
      const fullNameValid = validateRequired(fullName, t('booking.fullName'), t) === null
      const idNumberValid = validateRequired(idNumber, t('booking.idNumber'), t) === null && validateIdNumber(idNumber, idType, t) === null
      if (!fullNameValid) setFullNameError(true)
      if (!idNumberValid) setIdNumberError(true)
      return fullNameValid && idNumberValid
    }
    if (currentStep === 4) {
      const emailValid = validateRequired(email, t('booking.email'), t) === null && validateEmail(email, t) === null
      const phoneValid = phoneCountry
        ? validateRequired(phone, t('booking.phone'), t) === null && validatePhoneNumber(phone, t) === null
        : false
      const occupationValid = validateRequired(occupation, t('booking.occupation'), t) === null
      if (!emailValid) setEmailError(true)
      if (!phoneValid) setPhoneError(true)
      if (!occupationValid) setOccupationError(true)
      return emailValid && phoneValid && occupationValid
    }
    return true
  }

  const handleNext = () => {
    if (validateStep(step) && step < 5) {
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
      referralSource: referralSource as ReferralSource,
      referralOtherDetail: referralSource === 'OTHER' ? referralOtherDetail.trim() : undefined,
      language: (i18n.language ?? 'es').split('-')[0],
    })
    if (ok) {
      resetForm()
    } else {
      notify.error({
        title: t('booking.submitErrorToastTitle'),
        description: t('booking.submitError'),
      })
    }
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
    setReferralSource('')
    setReferralOtherDetail('')
    setDay(null)
    setTime(null)
    setFullNameError(false)
    setIdNumberError(false)
    setEmailError(false)
    setPhoneError(false)
    setOccupationError(false)
    setChildNameError(false)
    setReasonError(false)
    setReferralSourceError(false)
    setReferralOtherDetailError(false)
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
  const referralOtherDetailErrorMessage = referralOtherDetailError
    ? validateRequired(referralOtherDetail, t('booking.referral.otherDetail'), t)
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
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-3 md:grid-cols-5">
        {slots.map((slot) => (
          <button
            key={slot.start}
            type="button"
            aria-pressed={effectiveTime === slot.start}
            onClick={() => setTime(slot.start)}
            className={`${selectableClassName(effectiveTime === slot.start)} inline-flex h-11 w-full items-center justify-center whitespace-nowrap`}
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

      {selectedDay?.specialDay && (
        <p className="m-0 text-left font-body text-body-sm font-semibold text-link">
          Horario especial{selectedDay.eventName ? `: ${selectedDay.eventName}` : ''}
        </p>
      )}

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
            onClick={() => fetchWeek(toISODate(getTomorrow()))}
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
          <div className="grid grid-cols-2 gap-sm sm:grid-cols-3 md:grid-cols-5">
            {availableDates.map((date) => (
              <button
                key={date}
                type="button"
                aria-pressed={effectiveDay === date}
                onClick={() => selectDay(date)}
                className={`${selectableClassName(effectiveDay === date)} inline-flex h-11 w-full items-center justify-center whitespace-nowrap text-xs sm:text-sm`}
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
      <div className="flex flex-col gap-sm">
        <h4 className="m-0 text-left font-body text-base font-bold text-body-text">
          {t('booking.referral.title')}
        </h4>
        <label htmlFor="booking-referral-source" className="sr-only">
          {t('booking.referral.title')}
        </label>
        <select
          id="booking-referral-source"
          value={referralSource}
          onChange={(event) => {
            const source = event.target.value as ReferralSource | ''
            setReferralSource(source)
            setReferralSourceError(false)
            if (source !== 'OTHER') {
              setReferralOtherDetail('')
              setReferralOtherDetailError(false)
            }
          }}
          aria-invalid={referralSourceError}
          className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
        >
          <option value="">{t('booking.referral.placeholder')}</option>
          {REFERRAL_SOURCES.map((source) => (
            <option key={source} value={source}>{t(`booking.referral.options.${source}`)}</option>
          ))}
        </select>
        {referralSourceError && <p className="m-0 text-left font-body text-sm text-danger" role="alert">{t('booking.referral.required')}</p>}
      </div>
      {referralSource === 'OTHER' && (
        <TextField
          id="booking-referral-other"
          label={t('booking.referral.otherDetail')}
          value={referralOtherDetail}
          maxLength={255}
          onChange={(event) => {
            setReferralOtherDetail(event.target.value)
            if (referralOtherDetailError) setReferralOtherDetailError(false)
          }}
          error={referralOtherDetailErrorMessage}
        />
      )}
    </div>
  )

  const renderStepIdentity = () => (
    <div className="flex flex-col gap-[18px]">
      <h3 className="m-0 text-left font-heading text-h4 font-bold text-heading">
        {t('booking.wizard.identityTitle')}
      </h3>
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
  )

  const renderStepContact = () => (
    <div className="flex flex-col gap-[18px]">
      <h3 className="m-0 text-left font-heading text-h4 font-bold text-heading">
        {t('booking.wizard.contactTitle')}
      </h3>
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
  )

  const renderStepConfirm = () => (
    <div className="flex flex-col gap-lg">
      <h3 className="m-0 text-left font-heading text-h4 font-bold text-heading">
        {t('booking.wizard.confirmTitle')}
      </h3>

      <div className="flex flex-col gap-md">
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
        <div className="flex flex-col gap-xs">
          <span className="font-body text-xs text-body-text">{t('booking.referral.title')}</span>
          <span className="font-body text-sm text-heading">
            {referralSource && t(`booking.referral.options.${referralSource}`)}{referralSource === 'OTHER' && referralOtherDetail ? `: ${referralOtherDetail}` : ''}
          </span>
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
    3: renderStepIdentity,
    4: renderStepContact,
    5: renderStepConfirm,
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />

      <main className="flex items-center justify-center px-[30px] py-[30px] md:px-6 md:py-10">
        <section className="relative flex w-full max-w-[333px] flex-col overflow-hidden rounded-[13px] bg-bg-card shadow md:max-w-[900px] md:rounded-2xl">

          {/* Wizard */}
          <div className="flex w-full flex-col px-[30px] pb-[28px] pt-[40px] md:px-[50px] md:py-[40px]">
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
            <div className="mb-lg flex w-full items-center gap-sm">
              {STEPS.map((s, i) => {
                const stepNum = i + 1
                const isActive = step === stepNum
                const isCompleted = step > stepNum
                return (
                  <div
                    key={s.key}
                    className={`flex min-w-0 items-center gap-sm ${i < STEPS.length - 1 ? 'flex-1' : 'shrink-0'}`}
                  >
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
                        className={`h-0.5 min-w-2 flex-1 transition-colors ${
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

              {step < 5 ? (
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

        </section>

        {success && <BookingSuccessModal onClose={() => setSuccess(false)} />}
      </main>
    </div>
  )
}

export default BookingPage
