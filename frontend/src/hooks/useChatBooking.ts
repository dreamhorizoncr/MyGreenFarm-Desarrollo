import { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBooking } from './useBooking.ts'
import { slotKey, useSlotHolds } from './useSlotHolds.ts'
import {
  getTomorrow,
  isBookableWeekday,
  toISODate,
  WEEKDAY_BOOKING_KEYS,
} from '../utils/bookingDate.ts'
import {
  extractBookingData,
  buildBookingTemplate,
  normalizePhone,
  parseIdType,
  parseReferral,
  validateBookingForm,
  type BookingFormValues,
  type BookingField,
} from '../utils/bookingDataParser.ts'
import type { AvailableWeek, ReferralSource } from '../types/appointment.ts'
import type { ChatMessage } from './useChat.ts'

export type ChatBookingStage =
  | 'idle'
  | 'loading'
  | 'schedule-day'
  | 'schedule-time'
  | 'data'
  | 'review'
  | 'submitting'
  | 'error'

export type ChatBookingOptionVariant = 'primary' | 'secondary' | 'danger'

export interface ChatBookingOption {
  id: string
  label: string
  variant?: ChatBookingOptionVariant
  disabled?: boolean
}

type ErrorContext = 'load' | 'submit' | null

type AppendMessage = (
  role: ChatMessage['role'],
  content: string,
  options?: { blocked?: boolean; ephemeral?: boolean },
) => void

const CHAT_HOLDER_KEY = 'mgf_chat_booking_holder'

function emptyForm(): BookingFormValues {
  return {
    childName: '',
    reason: '',
    referralSource: '',
    referralOtherDetail: '',
    fullName: '',
    idType: '',
    idNumber: '',
    email: '',
    phone: '',
    occupation: '',
  }
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

export function useChatBooking(appendMessage: AppendMessage) {
  const { t, i18n } = useTranslation()
  const { fetchWeek, submit } = useBooking()
  const { holderId, myHold, hold, release, forget, isUnavailable } = useSlotHolds(CHAT_HOLDER_KEY)

  const [active, setActive] = useState(false)
  const [stage, setStage] = useState<ChatBookingStage>('idle')
  const [week, setWeek] = useState<AvailableWeek>({})
  const [form, setForm] = useState<BookingFormValues>(emptyForm)
  const [invalidFields, setInvalidFields] = useState<BookingField[]>([])
  const [dataReady, setDataReady] = useState(false)
  const [day, setDay] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [errorContext, setErrorContext] = useState<ErrorContext>(null)
  const flowRef = useRef(0)
  const submittingRef = useRef(false)

  const dayLabel = useCallback((date: string) => {
    const parsed = new Date(`${date}T12:00:00`)
    const weekdayKey = WEEKDAY_BOOKING_KEYS[parsed.getDay()]
    if (!weekdayKey) return date
    const dayNumber = String(parsed.getDate()).padStart(2, '0')
    const month = String(parsed.getMonth() + 1).padStart(2, '0')
    const weekday = t(`booking.days.${weekdayKey}`)
    return `${weekday} ${dayNumber}/${month}`
  }, [t])

  const longDayLabel = useCallback((date: string) => {
    const label = new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [i18n.language])

  const availableDates = useMemo(
    () => Object.keys(week).filter(
      (date) => isBookableWeekday(date) && (week[date]?.slots.length ?? 0) > 0,
    ),
    [week],
  )

  const daySlots = useMemo(
    () => (day ? week[day]?.slots ?? [] : []),
    [day, week],
  )

  const buildSummary = useCallback((
    values: BookingFormValues,
    dateLabel: string,
    timeLabel: string,
  ) => {
    const referralLabel = values.referralSource
      ? t(`booking.referral.options.${values.referralSource}`)
      : ''
    const referral = values.referralSource === 'OTHER' && values.referralOtherDetail
      ? `${referralLabel}: ${values.referralOtherDetail}`
      : referralLabel
    const idTypeLabels: Record<string, string> = {
      Costarricense: t('booking.idTypeOptions.costarricense'),
      Extranjero: t('booking.idTypeOptions.extranjero'),
    }
    const idTypeLabel = idTypeLabels[values.idType] ?? values.idType

    return [
      t('chat.booking.reviewTitle'),
      '',
      `• ${t('chat.booking.reviewSchedule')}: ${dateLabel} · ${timeLabel}`,
      `• ${t('booking.childName')}: ${values.childName}`,
      `• ${t('booking.reason')}: ${values.reason}`,
      `• ${t('booking.referral.label')}: ${referral}`,
      `• ${t('booking.fullName')}: ${values.fullName}`,
      `• ${t('booking.idType')}: ${idTypeLabel}`,
      `• ${t('booking.idNumber')}: ${values.idNumber}`,
      `• ${t('booking.email')}: ${values.email}`,
      `• ${t('booking.phone')}: ${values.phone}`,
      `• ${t('booking.occupation')}: ${values.occupation}`,
    ].join('\n')
  }, [t])

  const loadWeek = useCallback(async (notify = true) => {
    const flow = ++flowRef.current
    setStage('loading')
    setErrorContext(null)
    const data = await fetchWeek(toISODate(getTomorrow()))
    if (flowRef.current !== flow) return

    if (!data) {
      setStage('error')
      setErrorContext('load')
      appendMessage('bot', t('chat.booking.loadError'), { ephemeral: true })
      return
    }

    setWeek(data)
    const dates = Object.keys(data).filter(
      (date) => isBookableWeekday(date) && (data[date]?.slots.length ?? 0) > 0,
    )
    if (dates.length === 0) {
      setStage('error')
      setErrorContext('load')
      appendMessage('bot', t('chat.booking.noSlots'), { ephemeral: true })
      return
    }

    setStage('schedule-day')
    if (notify) appendMessage('bot', t('chat.booking.askDay'), { ephemeral: true })
  }, [appendMessage, fetchWeek, t])

  const start = useCallback((announce = true) => {
    setActive(true)
    setForm(emptyForm())
    setInvalidFields([])
    setDataReady(false)
    setErrorContext(null)
    submittingRef.current = false
    setDay(null)
    setTime(null)
    setWeek({})
    if (announce) appendMessage('bot', t('chat.booking.intro'), { ephemeral: true })
    void loadWeek()
  }, [appendMessage, loadWeek, t])

  const chooseDay = useCallback((date: string) => {
    release()
    setDay(date)
    setTime(null)
    appendMessage('user', dayLabel(date), { ephemeral: true })

    const slots = week[date]?.slots ?? []
    if (slots.length === 0) {
      appendMessage('bot', t('chat.booking.noTimes'), { ephemeral: true })
      setStage('schedule-day')
      return
    }

    setStage('schedule-time')
    appendMessage('bot', t('chat.booking.askTime', { day: longDayLabel(date) }), { ephemeral: true })
  }, [appendMessage, dayLabel, longDayLabel, release, t, week])

  const chooseTime = useCallback(async (startTime: string) => {
    if (!day) return
    const key = slotKey(day, startTime)
    if (myHold && myHold.key !== key) release()
    if (myHold?.key !== key) {
      const result = await hold(key)
      if (!result.ok) {
        appendMessage('bot', result.message ?? t('chat.booking.slotUnavailable'), { ephemeral: true })
        return
      }
    }

    setTime(startTime)
    appendMessage('user', startTime, { ephemeral: true })

    if (dataReady) {
      setStage('review')
      appendMessage('bot', buildSummary(form, longDayLabel(day), startTime), { ephemeral: true })
      appendMessage('bot', t('chat.booking.confirmQuestion'), { ephemeral: true })
      return
    }

    setStage('data')
    appendMessage('bot', t('chat.booking.dataPrompt'), { ephemeral: true })
  }, [appendMessage, buildSummary, dataReady, day, form, hold, longDayLabel, myHold, release, t])

  const handleText = useCallback(async (text: string) => {
    if (!active || stage !== 'data') return
    const trimmed = text.trim()
    if (!trimmed) return
    appendMessage('user', trimmed, { ephemeral: true })

    const extracted = extractBookingData(trimmed)
    if (Object.keys(extracted).length === 0) {
      appendMessage('bot', t('chat.booking.dataParseError'), { ephemeral: true })
      return
    }

    const referral = extracted.referralSource !== undefined
      ? parseReferral(extracted.referralSource)
      : null

    const next: BookingFormValues = {
      childName: clean(extracted.childName) ?? form.childName,
      reason: clean(extracted.reason) ?? form.reason,
      referralSource: referral ? (referral.source ?? '') : form.referralSource,
      referralOtherDetail: clean(extracted.referralOtherDetail)
        ?? (referral?.source === 'OTHER' ? clean(referral.detail) : undefined)
        ?? form.referralOtherDetail,
      fullName: clean(extracted.fullName) ?? form.fullName,
      idType: extracted.idType !== undefined
        ? (parseIdType(extracted.idType) ?? '')
        : form.idType,
      idNumber: clean(extracted.idNumber) ?? form.idNumber,
      email: clean(extracted.email) ?? form.email,
      phone: extracted.phone !== undefined
        ? normalizePhone(extracted.phone)
        : form.phone,
      occupation: clean(extracted.occupation) ?? form.occupation,
    }

    const result = await validateBookingForm(next, t)
    setForm(next)
    setInvalidFields(result.fields)

    if (result.errors.length > 0) {
      const message = [
        t('chat.booking.fixData'),
        '',
        ...result.errors.map((error) => `• ${error}`),
        '',
        t('chat.booking.resend'),
      ].join('\n')
      appendMessage('bot', message, { ephemeral: true })
      return
    }

    setDataReady(true)
    setStage('review')
    appendMessage('bot', buildSummary(next, day ? longDayLabel(day) : '', time ?? ''), { ephemeral: true })
    appendMessage('bot', t('chat.booking.confirmQuestion'), { ephemeral: true })
  }, [active, appendMessage, buildSummary, day, form, longDayLabel, stage, t, time])

  const confirm = useCallback(async () => {
    if (!day || !time || submittingRef.current) return
    submittingRef.current = true
    setStage('submitting')
    setErrorContext(null)
    appendMessage('user', t('chat.booking.confirm'), { ephemeral: true })

    try {
      const result = await submit({
        idType: form.idType,
        parentIdentification: form.idNumber.trim(),
        parentName: form.fullName.trim(),
        parentEmail: form.email.trim(),
        parentPhone: form.phone,
        parentOccupation: form.occupation.trim(),
        childName: form.childName.trim(),
        appointmentDate: `${day}T${time}:00`,
        parentNotes: form.reason.trim(),
        referralSource: form.referralSource as ReferralSource,
        referralOtherDetail: form.referralSource === 'OTHER' ? form.referralOtherDetail.trim() : undefined,
        language: (i18n.language ?? 'es').split('-')[0],
        holdId: holderId,
      })

      if (result.ok) {
        forget()
        appendMessage('bot', t('chat.booking.success', {
          date: longDayLabel(day),
          time,
        }), { ephemeral: true })
        setActive(false)
        setStage('idle')
        setDataReady(false)
        setDay(null)
        setTime(null)
        setForm(emptyForm())
        return
      }

      appendMessage('bot', result.message ?? t('chat.booking.submitError'), { ephemeral: true })

      if (result.slotTaken) {
        forget()
        setTime(null)
        appendMessage('bot', t('chat.booking.slotUnavailable'), { ephemeral: true })
        await loadWeek()
        return
      }

      setStage('error')
      setErrorContext('submit')
    } finally {
      submittingRef.current = false
    }
  }, [appendMessage, day, forget, form, holderId, i18n.language, loadWeek, longDayLabel, submit, t, time])

  const changeSchedule = useCallback(() => {
    release()
    setTime(null)
    setStage('schedule-day')
    appendMessage('user', t('chat.booking.changeSchedule'), { ephemeral: true })
    appendMessage('bot', t('chat.booking.askDay'), { ephemeral: true })
  }, [appendMessage, release, t])

  const cancel = useCallback(() => {
    if (!active) return
    flowRef.current += 1
    release()
    appendMessage('user', t('chat.booking.cancel'), { ephemeral: true })
    appendMessage('bot', t('chat.booking.cancelled'), { ephemeral: true })
    setActive(false)
    setStage('idle')
    setForm(emptyForm())
    setDataReady(false)
    setErrorContext(null)
    setDay(null)
    setTime(null)
    setWeek({})
  }, [active, appendMessage, release, t])

  const handleOption = useCallback((optionId: string) => {
    if (!active) return

    if (optionId === 'cancel') {
      cancel()
      return
    }

    if (optionId === 'back-day') {
      setStage('schedule-day')
      appendMessage('bot', t('chat.booking.askDay'), { ephemeral: true })
      return
    }

    if (stage === 'schedule-day' && optionId.startsWith('day:')) {
      chooseDay(optionId.slice(4))
      return
    }

    if (stage === 'schedule-time' && optionId.startsWith('time:')) {
      void chooseTime(optionId.slice(5))
      return
    }

    const stageActions: Partial<Record<ChatBookingStage, Record<string, () => void>>> = {
      review: {
        confirm: () => void confirm(),
        'change-schedule': changeSchedule,
      },
      error: {
        retry: () => void loadWeek(),
        'retry-submit': () => void confirm(),
        'change-schedule': changeSchedule,
      },
    }
    stageActions[stage]?.[optionId]?.()
  }, [active, appendMessage, cancel, changeSchedule, chooseDay, chooseTime, confirm, loadWeek, stage, t])

  const options = useMemo<ChatBookingOption[]>(() => {
    if (!active) return []
    const cancelOption: ChatBookingOption = {
      id: 'cancel',
      label: t('chat.booking.cancel'),
      variant: 'danger',
    }

    if (stage === 'loading') return [cancelOption]

    if (stage === 'schedule-day') {
      return [
        ...availableDates.map((date) => ({
          id: `day:${date}`,
          label: dayLabel(date),
          variant: 'secondary' as const,
        })),
        cancelOption,
      ]
    }

    if (stage === 'schedule-time') {
      return [
        ...daySlots.map((slot) => {
          const start = slot.slice(0, 5)
          return {
            id: `time:${start}`,
            label: start,
            variant: 'secondary' as const,
            disabled: day ? isUnavailable(slotKey(day, start)) : true,
          }
        }),
        { id: 'back-day', label: t('chat.booking.backToDays'), variant: 'secondary' },
        cancelOption,
      ]
    }

    if (stage === 'data') return [cancelOption]

    if (stage === 'review') {
      return [
        { id: 'confirm', label: t('chat.booking.confirm'), variant: 'primary' },
        { id: 'change-schedule', label: t('chat.booking.changeSchedule'), variant: 'secondary' },
        cancelOption,
      ]
    }

    if (stage === 'error') {
      if (errorContext === 'submit') {
        return [
          { id: 'retry-submit', label: t('chat.booking.retry'), variant: 'primary' },
          { id: 'change-schedule', label: t('chat.booking.changeSchedule'), variant: 'secondary' },
          cancelOption,
        ]
      }
      return [
        { id: 'retry', label: t('chat.booking.retry'), variant: 'primary' },
        cancelOption,
      ]
    }

    return []
  }, [active, availableDates, day, dayLabel, daySlots, errorContext, isUnavailable, stage, t])

  return {
    active,
    stage,
    options,
    copyTemplate: buildBookingTemplate(
      form, invalidFields, t('chat.booking.dataTemplate'),
      form.referralSource ? t(`booking.referral.options.${form.referralSource}`) : '',
    ),
    busy: stage === 'loading' || stage === 'submitting',
    start,
    handleText,
    handleOption,
    cancel,
  }
}
