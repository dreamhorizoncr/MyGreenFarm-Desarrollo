import { useCallback, useEffect, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import { useNavigate } from 'react-router-dom'
import 'react-phone-number-input/style.css'
import BookingSuccessModal from '../components/BookingSuccessModal.tsx'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const fullNameErrorMessage = validateRequired(
      fullName,
      t('booking.fullName'),
      t,
    )
    const idNumberErrorMessage =
      validateRequired(idNumber, t('booking.idNumber'), t) ??
      validateIdNumber(idNumber, idType, t)
    const emailErrorMessage =
      validateRequired(email, t('booking.email'), t) ?? validateEmail(email, t)
    const phoneErrorMessage = phoneCountry
      ? validateRequired(phone, t('booking.phone'), t) ??
        validatePhoneNumber(phone, t)
      : t('validation.countryRequired')
    const occupationErrorMessage = validateRequired(
      occupation,
      t('booking.occupation'),
      t,
    )
    const childNameErrorMessage = validateRequired(
      childName,
      t('booking.childName'),
      t,
    )
    const reasonErrorMessage = validateRequired(reason, t('booking.reason'), t)

    setFullNameError(fullNameErrorMessage !== null)
    setIdNumberError(idNumberErrorMessage !== null)
    setEmailError(emailErrorMessage !== null)
    setPhoneError(phoneErrorMessage !== null)
    setOccupationError(occupationErrorMessage !== null)
    setChildNameError(childNameErrorMessage !== null)
    setReasonError(reasonErrorMessage !== null)

    if (
      fullNameErrorMessage ||
      idNumberErrorMessage ||
      emailErrorMessage ||
      phoneErrorMessage ||
      occupationErrorMessage ||
      childNameErrorMessage ||
      reasonErrorMessage
    )
      return

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

  const isComplete =
    fullName.trim() !== '' &&
    idNumber.trim() !== '' &&
    email.trim() !== '' &&
    phoneCountry !== undefined &&
    phone.trim() !== '' &&
    occupation.trim() !== '' &&
    childName.trim() !== '' &&
    reason.trim() !== '' &&
    effectiveDay !== null &&
    effectiveTime !== null

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page px-[30px] py-[30px] md:px-6 md:py-10">
      <section className="relative flex w-full max-w-[333px] flex-col overflow-hidden rounded-[13px] bg-bg-card shadow md:h-auto md:min-h-[650px] md:max-w-[1180px] md:flex-row md:rounded-2xl">
        <div className="absolute right-[15px] top-[30px] z-20 md:right-[30px] md:top-[25px]">
          <LanguageSwitcher />
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex w-full flex-col md:flex-row"
        >
          <div className="flex w-full flex-col justify-center gap-lg px-[30px] pb-[28px] pt-[65px] md:w-1/2 md:gap-xl md:px-[70px] md:py-[55px]">
            <div className="flex items-center gap-sm">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-heading transition-colors hover:bg-[var(--grey-100)] focus-visible:outline-2 focus-visible:outline-green-500 focus-visible:outline-offset-2"
                aria-label={t('booking.back')}
              >
                <ArrowLeft size={30} strokeWidth={3} aria-hidden="true" />
              </button>
              <h2 className="m-0 text-left font-heading text-[28px] leading-none text-heading md:text-[42px]">
                {t('booking.title')}
              </h2>
            </div>

            <div className="flex flex-col gap-[18px]">
              <TextField
                id="booking-name"
                label={t('booking.fullName')}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value)
                  if (fullNameError) {
                    setFullNameError(false)
                  }
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
                  if (occupationError) {
                    setOccupationError(false)
                  }
                }}
                error={occupationErrorMessage}
              />
              <TextField
                id="booking-child"
                label={t('booking.childName')}
                value={childName}
                onChange={(e) => {
                  setChildName(e.target.value)
                  if (childNameError) {
                    setChildNameError(false)
                  }
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
                  onChange={(e) => {
                    setReason(e.target.value)
                    if (reasonError) {
                      setReasonError(false)
                    }
                  }}
                  rows={3}
                  className="w-full resize-none border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
                />
              </TextField>
            </div>
          </div>

          <div className="flex w-full flex-col gap-lg bg-bg-card px-[30px] pb-[28px] pt-[40px] md:w-1/2 md:gap-xl md:px-[50px] md:py-[55px]">
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

            <div className="mt-auto flex flex-col gap-md">
              {submitError && (
                <p className="m-0 text-right font-body text-sm text-danger">
                  {submitError}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isComplete || submitting}
                  className="w-48 rounded-full bg-green-500 px-lg py-sm font-body text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-[var(--grey-600)] disabled:hover:bg-[var(--grey-600)]"
                >
                  {submitting ? t('booking.submitting') : t('booking.submit')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {success && <BookingSuccessModal onClose={() => setSuccess(false)} />}
    </main>
  )
}

export default BookingPage