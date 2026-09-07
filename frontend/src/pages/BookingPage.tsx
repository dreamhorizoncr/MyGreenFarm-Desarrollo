import {
  useState,
  type FormEvent,
  type InputHTMLAttributes,
} from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import { useNavigate } from 'react-router-dom'
import 'react-phone-number-input/style.css'
import BookingSuccessModal from '../components/BookingSuccessModal.tsx'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
import TextField from '../components/ui/TextField.tsx'
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
      className="h-[38px] w-full border-b border-neutral-300 bg-transparent px-0 font-body text-[15px] text-body-text outline-none transition focus:border-green-500"
    />
  )
}

const MORNING_TIMES = [
  '6:00',
  '6:45',
  '7:45',
  '8:00',
  '8:30',
  '8:45',
  '9:00',
  '9:30',
  '10:00',
  '11:00',
  '11:30',
]

const AFTERNOON_TIMES = [
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '17:45',
]

type DayKey = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday'

const DAYS: DayKey[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

function BookingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [occupation, setOccupation] = useState('')
  const [childName, setChildName] = useState('')
  const [reason, setReason] = useState('')
  const [day, setDay] = useState<DayKey>('monday')
  const [time, setTime] = useState('6:00')
  const [submitted, setSubmitted] = useState(false)

  const [fullNameError, setFullNameError] = useState(false)
  const [idNumberError, setIdNumberError] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [occupationError, setOccupationError] = useState(false)
  const [childNameError, setChildNameError] = useState(false)
  const [reasonError, setReasonError] = useState(false)

  const handlePhoneChange = (value?: string) => {
    const next = value ?? ''
    setPhone(next)
    setPhoneError(validatePhoneNumber(next, t) !== null)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const fullNameErrorMessage = validateRequired(
      fullName,
      t('booking.fullName'),
      t,
    )
    const idNumberErrorMessage =
      validateRequired(idNumber, t('booking.idNumber'), t) ??
      validateIdNumber(idNumber, t)
    const emailErrorMessage =
      validateRequired(email, t('booking.email'), t) ?? validateEmail(email, t)
    const phoneErrorMessage =
      validateRequired(phone, t('booking.phone'), t) ??
      validatePhoneNumber(phone, t)
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

    setSubmitted(true)
  }

  const isComplete =
    fullName.trim() !== '' &&
    idNumber.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    occupation.trim() !== '' &&
    childName.trim() !== '' &&
    reason.trim() !== ''

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
      validateIdNumber(idNumber, t)
    : null
  const emailErrorMessage = emailError
    ? validateRequired(email, t('booking.email'), t) ?? validateEmail(email, t)
    : null
  const phoneErrorMessage = phoneError
    ? validateRequired(phone, t('booking.phone'), t) ??
      validatePhoneNumber(phone, t)
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
              <TextField
                id="booking-id"
                label={t('booking.idNumber')}
                value={idNumber}
                onChange={(e) => {
                  const next = e.target.value
                  setIdNumber(next)
                  setIdNumberError(validateIdNumber(next, t) !== null)
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
                  defaultCountry="CR"
                  value={phone}
                  onChange={handlePhoneChange}
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

            <div className="flex flex-wrap gap-sm">
              {DAYS.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={day === d}
                  onClick={() => setDay(d)}
                  className={selectableClassName(day === d)}
                >
                  {t(`booking.days.${d}`)}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-sm">
              <h4 className="m-0 text-left font-body text-base font-bold text-body-text">
                {t('booking.morning')}
              </h4>
              <div className="grid grid-cols-3 gap-sm md:grid-cols-4">
                {MORNING_TIMES.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={time === slot}
                    onClick={() => setTime(slot)}
                    className={selectableClassName(time === slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-sm">
              <h4 className="m-0 text-left font-body text-base font-bold text-body-text">
                {t('booking.afternoon')}
              </h4>
              <div className="grid grid-cols-3 gap-sm md:grid-cols-4">
                {AFTERNOON_TIMES.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    aria-pressed={time === slot}
                    onClick={() => setTime(slot)}
                    className={selectableClassName(time === slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-md">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isComplete}
                  className="w-48 rounded-full bg-green-500 px-lg py-sm font-body text-sm font-semibold text-white transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:bg-[var(--grey-600)] disabled:hover:bg-[var(--grey-600)]"
                >
                  {t('booking.submit')}
                </button>
              </div>
            </div>
          </div>
        </form>
      </section>

      {submitted && <BookingSuccessModal onClose={() => setSubmitted(false)} />}
    </main>
  )
}

export default BookingPage
