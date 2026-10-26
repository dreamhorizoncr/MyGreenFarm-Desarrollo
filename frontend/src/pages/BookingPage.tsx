import { useCallback, useEffect, useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeftIcon, CheckIcon } from '@animateicons/react/lucide'
import PhoneInput from 'react-phone-number-input'
import { useNavigate } from 'react-router-dom'
import 'react-phone-number-input/style.css'
import BookingSuccessModal from '../components/BookingSuccessModal.tsx'
import Navbar from '../components/Navbar.tsx'
import TextField from '../components/ui/TextField.tsx'
import Select from '../components/ui/Select.tsx'
import CountrySelect from '../components/ui/CountrySelect.tsx'
import { phoneLabels } from '../utils/phoneLabels.ts'
import { useBooking } from '../hooks/useBooking.ts'
import { slotKey, useSlotHolds } from '../hooks/useSlotHolds.ts'
import { appointmentService } from '../services/appointment.ts'
import { notify } from '../utils/notifications.ts'
import {
  validateEmail,
  validateBookingEmailDomain,
  validateIdNumber,
  validatePhoneNumber,
  validateRequired,
  validateSafeText,
} from '../utils/validators.ts'
import type { ReferralSource } from '../types/appointment.ts'
import FieldHint from '../components/ui/FieldHint.tsx'
import AutoHeight from '../components/ui/AutoHeight.tsx'
import TabHighlight from '../components/ui/TabHighlight.tsx'
import { tabCarouselClass, useTabCarousel } from '../hooks/useTabCarousel.ts'

function BookingPhoneInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-full w-full bg-transparent pl-2 font-body text-body-sm text-body-text-dark outline-none"
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

function WizardProgress({ step }: Readonly<{ step: number }>) {
  return (
    <div className="mb-lg flex w-full items-center gap-sm">
      {STEPS.map((s, i) => {
        const stepNum = i + 1
        const isActive = step === stepNum
        const isCompleted = step > stepNum
        let stepCircleClass = 'border border-green-500 bg-white text-green-600'
        if (isActive) stepCircleClass = 'bg-green-500 text-white'
        if (isCompleted) stepCircleClass = 'bg-green-500 text-white'
        return (
          <div
            key={s.key}
            className={`flex min-w-0 items-center gap-sm ${i < STEPS.length - 1 ? 'flex-1' : 'shrink-0'}`}
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-full font-body text-body-sm font-semibold transition-colors ${stepCircleClass}`}
            >
              {isCompleted ? <CheckIcon size={16} /> : stepNum}
            </div>
            {i < STEPS.length - 1 && (
              <div className="h-0.5 min-w-2 flex-1 overflow-hidden bg-[var(--grey-100)]">
                <div
                  className={`h-full origin-left bg-green-500 transition-transform duration-500 ease-out ${
                    step > stepNum ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

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
  const slotHolds = useSlotHolds()
  const releaseSlotHold = slotHolds.release

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
  const dayRowRef = useTabCarousel(effectiveDay)
  const isSlotFree = (date: string, start: string) => !slotHolds.isUnavailable(slotKey(date, start))
  const firstFreeTime = effectiveDay
    ? availability[effectiveDay]?.slots.map((slot) => slot.slice(0, 5)).find((start) => isSlotFree(effectiveDay, start)) ?? null
    : null
  const effectiveTime = time && effectiveDay && isSlotFree(effectiveDay, time) ? time : firstFreeTime
  const holdsSelection = Boolean(effectiveDay && effectiveTime && slotHolds.myHold?.key === slotKey(effectiveDay, effectiveTime))
  const selectedDay = effectiveDay ? availability[effectiveDay] : null

  const [eventNames, setEventNames] = useState<Record<string, string>>({})
  useEffect(() => {
    const items = Object.entries(availability).flatMap(([date, day]) =>
      day.eventName ? [{ entityId: date.replaceAll('-', ''), fieldName: 'eventName', originalText: day.eventName }] : [],
    )
    if (items.length === 0) return
    let cancelled = false
    appointmentService.translateBatch('AVAILABILITY_EVENT', i18n.language.split('-')[0], items)
      .then((result) => {
        if (cancelled) return
        setEventNames(Object.fromEntries(Object.keys(availability).flatMap((date) => {
          const value = result[`${date.replaceAll('-', '')}:eventName`]
          return value ? [[date, value]] : []
        })))
      })
      .catch(() => {
        // Si falla la traducción se muestra el nombre original.
      })
    return () => {
      cancelled = true
    }
  }, [availability, i18n.language])
  const selectedDaySlots = selectedDay?.slots ?? []
  const morningSlots = parseSlots(selectedDaySlots.filter((slot) => Number(slot.slice(0, 2)) < 12))
  const afternoonSlots = parseSlots(selectedDaySlots.filter((slot) => Number(slot.slice(0, 2)) >= 12))

  const handlePhoneChange = (next = '') => {
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

  const validateScheduleStep = () => effectiveDay !== null && effectiveTime !== null

  const validateChildStep = () => {
    const childNameValid = validateRequired(childName, t('booking.childName'), t) === null && validateSafeText(childName, t) === null
    const reasonValid = validateRequired(reason, t('booking.reason'), t) === null && validateSafeText(reason, t) === null
    const referralSourceValid = referralSource !== ''
    const referralOtherDetailValid = referralSource !== 'OTHER' || (validateRequired(referralOtherDetail, t('booking.referral.otherDetail'), t) === null && validateSafeText(referralOtherDetail, t) === null)
    if (!childNameValid) setChildNameError(true)
    if (!reasonValid) setReasonError(true)
    if (!referralSourceValid) setReferralSourceError(true)
    if (!referralOtherDetailValid) setReferralOtherDetailError(true)
    return childNameValid && reasonValid && referralSourceValid && referralOtherDetailValid
  }

  const validateIdentityStep = () => {
    const fullNameValid = validateRequired(fullName, t('booking.fullName'), t) === null && validateSafeText(fullName, t) === null
    const idNumberValid = validateRequired(idNumber, t('booking.idNumber'), t) === null && validateIdNumber(idNumber, idType, t) === null
    if (!fullNameValid) setFullNameError(true)
    if (!idNumberValid) setIdNumberError(true)
    return fullNameValid && idNumberValid
  }

  const validateContactStep = () => {
    const emailFormatValid = validateRequired(email, t('booking.email'), t) === null && validateEmail(email, t) === null
    const emailDomainError = emailFormatValid ? validateBookingEmailDomain(email, t) : null
    const emailValid = emailFormatValid && emailDomainError === null
    if (emailDomainError) {
      notify.error({ title: t('booking.emailDomainToastTitle'), description: emailDomainError })
    }
    const phoneValid = phoneCountry
      ? validateRequired(phone, t('booking.phone'), t) === null && validatePhoneNumber(phone, t) === null
      : false
    const occupationValid = validateRequired(occupation, t('booking.occupation'), t) === null && validateSafeText(occupation, t) === null
    if (!emailValid) setEmailError(true)
    if (!phoneValid) setPhoneError(true)
    if (!occupationValid) setOccupationError(true)
    return emailValid && phoneValid && occupationValid
  }

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        return validateScheduleStep()
      case 2:
        return validateChildStep()
      case 3:
        return validateIdentityStep()
      case 4:
        return validateContactStep()
      default:
        return true
    }
  }

  const stepFilled = (() => {
    switch (step) {
      case 1:
        return effectiveDay !== null && effectiveTime !== null
      case 2:
        return Boolean(childName.trim() && reason.trim() && referralSource) && (referralSource !== 'OTHER' || Boolean(referralOtherDetail.trim()))
      case 3:
        return Boolean(fullName.trim() && idNumber.trim())
      case 4:
        return Boolean(email.trim() && phone.trim() && phoneCountry && occupation.trim())
      default:
        return true
    }
  })()

  const holdSelectedSlot = async () => {
    if (!effectiveDay || !effectiveTime) return false
    const result = await slotHolds.hold(slotKey(effectiveDay, effectiveTime))
    if (!result.ok) {
      notify.error({ title: t('booking.slotUnavailableTitle'), description: result.message })
      setTime(null)
      setStep(1)
    }
    return result.ok
  }

  const handleSelectTime = (start: string) => {
    setTime(start)
    if (!effectiveDay) return
    void slotHolds.hold(slotKey(effectiveDay, start)).then((result) => {
      if (result.ok) return
      notify.error({ title: t('booking.slotUnavailableTitle'), description: result.message })
      setTime(null)
    })
  }

  const handleNext = async () => {
    if (!validateStep(step) || step >= 5) return
    if (!(await holdSelectedSlot())) return
    setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    if (!effectiveDay || !effectiveTime) return

    const result = await submit({
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
      holdId: slotHolds.holderId,
    })
    if (result.ok) {
      slotHolds.forget()
      resetForm()
    } else if (result.slotTaken) {
      notify.error({ title: t('booking.slotUnavailableTitle'), description: result.message ?? t('booking.submitError') })
      setTime(null)
      setStep(1)
      void fetchWeek(toISODate(getTomorrow()))
    } else {
      notify.error({
        title: t('booking.submitErrorToastTitle'),
        description: result.message ?? t('booking.submitError'),
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
    releaseSlotHold()
    setFullNameError(false)
    setIdNumberError(false)
    setEmailError(false)
    setPhoneError(false)
    setOccupationError(false)
    setChildNameError(false)
    setReasonError(false)
    setReferralSourceError(false)
    setReferralOtherDetailError(false)
  }, [releaseSlotHold])

  const selectableClassName = (active: boolean) =>
    `rounded-full border px-md py-sm font-body text-body-sm font-semibold transition-colors ${
      active
        ? 'border-green-500 bg-green-500 text-white'
        : 'border-green-500 bg-white text-heading hover:bg-green-50'
    }`

  function computePhoneErrorMessage() {
    if (!phoneError) return null
    if (!phoneCountry) return t('validation.countryRequired')
    return validateRequired(phone, t('booking.phone'), t) ?? validatePhoneNumber(phone, t)
  }

  function computeStepErrorMessages() {
    return {
      fullNameErrorMessage: fullNameError
        ? validateRequired(fullName, t('booking.fullName'), t) ?? validateSafeText(fullName, t)
        : null,
      idNumberErrorMessage: idNumberError
        ? validateRequired(idNumber, t('booking.idNumber'), t) ?? validateIdNumber(idNumber, idType, t)
        : null,
      emailErrorMessage: emailError
        ? validateRequired(email, t('booking.email'), t) ?? validateEmail(email, t) ?? validateBookingEmailDomain(email, t)
        : null,
      phoneErrorMessage: computePhoneErrorMessage(),
      occupationErrorMessage: occupationError
        ? validateRequired(occupation, t('booking.occupation'), t) ?? validateSafeText(occupation, t)
        : null,
      childNameErrorMessage: childNameError
        ? validateRequired(childName, t('booking.childName'), t) ?? validateSafeText(childName, t)
        : null,
      reasonErrorMessage: reasonError
        ? validateRequired(reason, t('booking.reason'), t) ?? validateSafeText(reason, t)
        : null,
      referralOtherDetailErrorMessage: referralOtherDetailError
        ? validateRequired(referralOtherDetail, t('booking.referral.otherDetail'), t) ?? validateSafeText(referralOtherDetail, t)
        : null,
    }
  }

  const {
    fullNameErrorMessage,
    idNumberErrorMessage,
    emailErrorMessage,
    phoneErrorMessage,
    occupationErrorMessage,
    childNameErrorMessage,
    reasonErrorMessage,
    referralOtherDetailErrorMessage,
  } = computeStepErrorMessages()

  const dayLabel = (date: string) => {
    const parsed = new Date(`${date}T12:00:00`)
    const weekdayKey = WEEKDAY_BOOKING_KEYS[parsed.getDay()]
    if (!weekdayKey) return date
    const dayShort = String(parsed.getDate()).padStart(2, '0')
    const monthShort = String(parsed.getMonth() + 1).padStart(2, '0')
    const dayName = t(`booking.days.${weekdayKey}`)
    return `${dayName} ${dayShort}/${monthShort}`
  }

  const renderSlots = (slots: Slot[]) =>
    slots.length > 0 ? (
      <div className="grid grid-cols-2 gap-sm sm:grid-cols-3 md:grid-cols-5">
        {slots.map((slot) => {
          const unavailable = effectiveDay ? !isSlotFree(effectiveDay, slot.start) : false
          return (
            <button
              key={slot.start}
              type="button"
              aria-pressed={effectiveTime === slot.start}
              disabled={unavailable}
              title={unavailable ? t('booking.slotHeldByOther') : undefined}
              onClick={() => handleSelectTime(slot.start)}
              className={`${selectableClassName(effectiveTime === slot.start)} inline-flex h-11 w-full flex-col items-center justify-center whitespace-nowrap leading-tight disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:hover:bg-neutral-100`}
            >
              {slot.start}
              {unavailable && <span className="text-[0.65rem] font-normal">{t('booking.slotHeldByOther')}</span>}
            </button>
          )
        })}
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
            onClick={() => fetchWeek(toISODate(getTomorrow()))}
            className="w-fit rounded-full bg-green-500 px-lg py-sm font-body text-body-sm font-semibold text-white transition-colors hover:bg-green-600"
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
          <div ref={dayRowRef} className={`${tabCarouselClass} -my-1 md:my-0 md:grid md:grid-cols-5 md:p-0 md:mx-0`}>
            {availableDates.map((date) => (
              <button
                key={date}
                type="button"
                aria-pressed={effectiveDay === date}
                onClick={() => selectDay(date)}
                className={`relative inline-flex h-11 items-center justify-center whitespace-nowrap rounded-full border border-green-500 px-md py-sm font-body text-body-sm font-semibold transition-colors duration-300 md:w-full ${
                  effectiveDay === date ? 'text-white' : 'bg-transparent text-heading hover:bg-green-50'
                }`}
              >
                {effectiveDay === date && <TabHighlight layoutId="booking-day-tab" className="bg-green-500" />}
                {dayLabel(date)}
              </button>
            ))}
          </div>

          {selectedDay?.specialDay && (
            <p className="m-0 text-left font-body text-body-sm font-semibold text-link">
              {t('booking.specialSchedule')}{selectedDay.eventName ? `: ${eventNames[effectiveDay ?? ''] ?? selectedDay.eventName}` : ''}
            </p>
          )}

          <div className="flex flex-col gap-sm">
            <h4 className="m-0 text-left font-body text-body font-bold text-body-text">
              {t('booking.morning')}
            </h4>
            {renderSlots(morningSlots)}
          </div>

          <div className="flex flex-col gap-sm">
            <h4 className="m-0 text-left font-body text-body font-bold text-body-text">
              {t('booking.afternoon')}
            </h4>
            {renderSlots(afternoonSlots)}
          </div>

          {holdsSelection && (
            <p className="m-0 text-left font-body text-body-sm text-neutral-500">{t('booking.slotHeldNote')}</p>
          )}
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
        hint={t('fields.booking.childName.hint')}
        placeholder={t('fields.booking.childName.placeholder')}
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
        hint={t('fields.booking.reason.hint')}
        id="booking-reason"
        label={t('booking.reason')}
        error={reasonErrorMessage}
      >
        <textarea
          placeholder={t('fields.booking.reason.placeholder')}
          id="booking-reason"
          value={reason}
          maxLength={4000}
          onChange={(e) => {
            setReason(e.target.value)
            if (reasonError) setReasonError(false)
          }}
          rows={3}
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-md font-body text-body-sm text-body-text-dark outline-none transition focus:border-green-500"
        />
      </TextField>
      <div className="flex flex-col gap-sm">
        <h4 className="m-0 text-left font-body text-body-sm font-semibold text-heading">
          {t('booking.referral.title')}
        </h4>
        <label htmlFor="booking-referral-source" className="sr-only">
          {t('booking.referral.title')}
        </label>
        <div>
          <Select
            id="booking-referral-source"
            value={referralSource}
            onChange={(value) => {
              const source = value as ReferralSource | ''
              setReferralSource(source)
              setReferralSourceError(false)
              if (source !== 'OTHER') {
                setReferralOtherDetail('')
                setReferralOtherDetailError(false)
              }
            }}
            placeholder={t('booking.referral.placeholder')}
            options={REFERRAL_SOURCES.map((source) => ({ value: source, label: t(`booking.referral.options.${source}`) }))}
            className={`w-full rounded-xl border bg-white px-md ${referralSourceError ? 'border-danger' : 'border-neutral-200'}`}
          />
          <FieldHint>{t('fields.booking.referral.hint')}</FieldHint>
        </div>
        {referralSourceError && <p className="m-0 text-left font-body text-body-sm text-danger" role="alert">{t('booking.referral.required')}</p>}
      </div>
      {referralSource === 'OTHER' && (
        <TextField
          hint={t('fields.booking.referralOther.hint')}
          placeholder={t('fields.booking.referralOther.placeholder')}
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
        hint={t('fields.booking.fullName.hint')}
        placeholder={t('fields.booking.fullName.placeholder')}
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
        <label className="mb-[4px] block text-left font-body text-body-sm font-semibold text-heading">
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
        hint={t('fields.booking.idNumber.hint')}
        placeholder={t('fields.booking.idNumber.placeholder')}
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
        hint={t('fields.booking.email.hint')}
        placeholder={t('fields.booking.email.placeholder')}
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
        hint={t('fields.booking.phone.hint')}
        id="booking-phone"
        label={t('booking.phone')}
        error={phoneErrorMessage}
      >
        <PhoneInput
          placeholder={t('fields.booking.phone.placeholder')}
          id="booking-phone"
          className="h-11 rounded-xl border border-neutral-200 bg-white px-md"
          value={phone}
          onChange={handlePhoneChange}
          onCountryChange={handleCountryChange}
          onBlur={handlePhoneBlur}
          inputComponent={BookingPhoneInput}
          countrySelectComponent={CountrySelect}
          labels={phoneLabels(i18n.language)}
        />
      </TextField>
      <TextField
        hint={t('fields.booking.occupation.hint')}
        placeholder={t('fields.booking.occupation.placeholder')}
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
          <span className="font-body text-caption text-body-text">{t('booking.wizard.schedule')}</span>
          <span className="font-body text-body-sm font-semibold text-heading">
            {effectiveDay && dayLabel(effectiveDay)} - {effectiveTime}
          </span>
        </div>

        <div className="h-px bg-neutral-300" />

        <div className="flex flex-col gap-xs">
          <span className="font-body text-caption text-body-text">{t('booking.childName')}</span>
          <span className="font-body text-body-sm font-semibold text-heading">{childName}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-caption text-body-text">{t('booking.reason')}</span>
          <span className="font-body text-body-sm text-heading">{reason}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-caption text-body-text">{t('booking.referral.title')}</span>
          <span className="font-body text-body-sm text-heading">
            {referralSource && t(`booking.referral.options.${referralSource}`)}{referralSource === 'OTHER' && referralOtherDetail ? `: ${referralOtherDetail}` : ''}
          </span>
        </div>

        <div className="h-px bg-neutral-300" />

        <div className="flex flex-col gap-xs">
          <span className="font-body text-caption text-body-text">{t('booking.fullName')}</span>
          <span className="font-body text-body-sm font-semibold text-heading">{fullName}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-caption text-body-text">{t('booking.idNumber')}</span>
          <span className="font-body text-body-sm text-heading">{idType} - {idNumber}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-caption text-body-text">{t('booking.occupation')}</span>
          <span className="font-body text-body-sm text-heading">{occupation}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-caption text-body-text">{t('booking.email')}</span>
          <span className="font-body text-body-sm text-heading">{email}</span>
        </div>
        <div className="flex flex-col gap-xs">
          <span className="font-body text-caption text-body-text">{t('booking.phone')}</span>
          <span className="font-body text-body-sm text-heading">{phone}</span>
        </div>
      </div>

      {submitError && (
        <p className="m-0 text-center font-body text-body-sm text-danger">
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

      <main className="flex items-start justify-center px-[30px] py-[30px] md:px-6 md:py-10">
        <section className="relative flex w-full max-w-[333px] flex-col overflow-hidden rounded-[13px] border border-neutral-200 bg-bg-card shadow md:max-w-[900px] md:rounded-[20px]">

          <div className="flex w-full flex-col px-[30px] pb-[28px] pt-[40px] md:px-[50px] md:py-[40px]">
            <div className="mb-lg flex items-center gap-sm">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-heading focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2"
                aria-label={t('booking.back')}
              >
                <ArrowLeftIcon size={30} aria-hidden="true" />
              </button>
              <h2 className="m-0 text-left font-heading text-h3 leading-tight text-heading">
                {t('booking.title')}
              </h2>
            </div>

            <WizardProgress step={step} />

            <AutoHeight className="-mx-1 px-1 pb-1">
              {stepContents[step]()}
            </AutoHeight>

            <div className="mt-lg flex items-center justify-between gap-sm">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex h-11 items-center gap-xs rounded-full border border-green-500 px-md font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50"
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
                  onClick={() => void handleNext()}
                  disabled={!stepFilled}
                  className="flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-orange-500"
                >
                  {t('booking.wizard.next')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-[var(--grey-600)] disabled:hover:bg-[var(--grey-600)]"
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
