import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SendIcon, XIcon } from '@animateicons/react/lucide'
import type { ChatController } from '../../hooks/useChat'
import type { ChatResponse } from '../../services/chat.service'
import { useChatBooking } from '../../hooks/useChatBooking'
import ChatMessage from './ChatMessage'
import ChatSuggestions from './ChatSuggestions'
import ChatBookingOptions from './ChatBookingOptions'
import ChickAvatar, { type ChickMood, type ChickReaction, type ChickState } from './ChickAvatar'
import { userStorage } from '../../utils/userStorage'
import { useTranslation } from 'react-i18next'
import { animationsStopped } from '../../utils/reducedMotion'

const THANKS_PATTERN = /\b(gracias|thanks|thank you|merci)\b/i
const WORD_PATTERN = /\S+\s*/y
const MAX_BOOKING_INPUT = 3000
const ACTION_DELAY = 3500
const NAV_TARGETS: Record<string, string> = {
  news: '/news',
  gallery: '/multimedia',
  forum: '/forum',
  services: '/services',
  clubs: '/clubs',
  vacancies: '/vacancies',
  about: '/about-us',
  'green-hearts': '/green-hearts',
}

function nextWordEnd(text: string, from: number) {
  WORD_PATTERN.lastIndex = from
  const match = WORD_PATTERN.exec(text)
  return match ? from + match[0].length : text.length
}

interface ChatPanelProps {
  chat: ChatController
  onClose: () => void
  onOpenTerms: () => void
}

export default function ChatPanel({ chat, onClose, onOpenTerms }: Readonly<ChatPanelProps>) {
  const { messages, input, setInput, sendMessage, loading, appendMessage } = chat
  const booking = useChatBooking(appendMessage)
  const { t } = useTranslation()
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = userStorage.getUser()
  const isAuthenticated = Boolean(user)
  const firstName = user?.firstName?.trim()
  const [focused, setFocused] = useState(false)
  const [mood, setMood] = useState<ChickMood>('neutral')
  const [reaction, setReaction] = useState<{ type: ChickReaction; key: number } | null>(null)
  const [talk, setTalk] = useState<{ text: string; shown: number } | null>(null)
  const lastBotId = useRef(messages.at(-1)?.id)
  const moodTimer = useRef(0)
  const actionTimer = useRef(0)
  const wasBookingActive = useRef(false)

  const react = (type: ChickReaction) => setReaction((current) => ({ type, key: (current?.key ?? 0) + 1 }))

  const showMood = (next: ChickMood, duration: number) => {
    window.clearTimeout(moodTimer.current)
    setMood(next)
    moodTimer.current = window.setTimeout(() => setMood('neutral'), duration)
  }

  useEffect(() => () => window.clearTimeout(moodTimer.current), [])
  useEffect(() => () => window.clearTimeout(actionTimer.current), [])

  useEffect(() => {
    if (wasBookingActive.current && !booking.active) setInput('')
    wasBookingActive.current = booking.active
  }, [booking.active, setInput])

  useEffect(() => {
    const last = messages.at(-1)
    if (last?.role !== 'bot' || last.id === lastBotId.current) return
    lastBotId.current = last.id
    const timer = window.setTimeout(() => {
      if (last.blocked) {
        showMood('worried', 3500)
        react('shake')
      } else if (animationsStopped() || last.content.length > 240 || last.content.includes('\n')) {
        showMood('happy', 1600)
      } else {
        setTalk({ text: last.content, shown: 0 })
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [messages])

  useEffect(() => {
    if (!talk) return
    if (talk.shown >= talk.text.length) {
      const timer = window.setTimeout(() => {
        setTalk(null)
        showMood('happy', 1600)
      }, 120)
      return () => window.clearTimeout(timer)
    }
    const next = nextWordEnd(talk.text, talk.shown)
    const pause = /[.,!?;:]\s*$/.test(talk.text.slice(talk.shown, next)) ? 320 : 85
    const timer = window.setTimeout(() => setTalk({ text: talk.text, shown: next }), talk.shown === 0 ? 0 : pause)
    return () => window.clearTimeout(timer)
  }, [talk])

  useEffect(() => {
    if (!focused || !input.trim()) return
    const timer = window.setTimeout(() => react('nod'), 800)
    return () => window.clearTimeout(timer)
  }, [input, focused])

  const busy = loading || booking.busy
  let chickState: ChickState = 'idle'
  if (busy) chickState = 'thinking'
  else if (talk) chickState = 'speaking'
  else if (focused && input.trim()) chickState = 'listening'
  const talkTick = talk?.shown ?? 0

  const scrollToFooter = () => {
    const footer = document.getElementById('site-footer')
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate('/')
    window.setTimeout(() => {
      document.getElementById('site-footer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 350)
  }

  const scheduleChatAction = (response: ChatResponse) => {
    if (!response.action) return
    window.clearTimeout(actionTimer.current)
    actionTimer.current = window.setTimeout(() => {
      if (response.action === 'NAVIGATE') {
        const path = response.target ? NAV_TARGETS[response.target] : undefined
        if (!path) return
        onClose()
        navigate(path)
        return
      }
      if (response.action === 'SCROLL_FOOTER') {
        onClose()
        window.setTimeout(scrollToFooter, 80)
        return
      }
      if (response.action === 'OPEN_TERMS') {
        onClose()
        onOpenTerms()
      }
    }, ACTION_DELAY)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || busy) return

    window.clearTimeout(actionTimer.current)

    if (booking.active) {
      setInput('')
      await booking.handleText(trimmed)
      return
    }

    if (THANKS_PATTERN.test(trimmed)) react('thanks')
    const response = await sendMessage()
    if (response?.action === 'START_BOOKING') booking.start(false)
    else if (response?.action) scheduleChatAction(response)
  }

  const closeChat = () => {
    onClose()
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, booking.active, booking.stage])

  return (
    <section className="flex h-full min-h-0 flex-col bg-white text-body-text-dark">
      <header className="flex min-h-17 shrink-0 items-center justify-between border-b border-green-600 bg-green-500 px-6 py-3 text-left text-white">
        <div className="flex min-w-0 items-center gap-3">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => react('tickle')}
              aria-label={t('chat.tickle')}
              className="shrink-0 rounded-full bg-white/15 p-0.5 transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ChickAvatar state={chickState} mood={mood} talkTick={talkTick} reaction={reaction} inputDirection="down" size={40} />
            </button>
          )}
          <p className="m-0 font-heading text-h4 font-bold leading-tight">{t('chat.title')}</p>
        </div>
        <button
          onClick={closeChat}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 text-white transition-colors hover:bg-white/15"
          aria-label={t('chat.close')}
        >
          <XIcon size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="modal-scroll relative flex flex-1 flex-col space-y-3 bg-white px-md py-md text-left">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center pt-3 text-center">
            <ChickAvatar
              state={chickState}
              mood={mood}
              talkTick={talkTick}
              reaction={reaction}
              inputDirection="down"
              size={144}
              label={t('chat.assistantAlt')}
            />
            <p className="m-0 mt-3 font-heading text-h4 font-bold leading-snug text-heading">
              {firstName ? t('chat.greetingNamed', { name: firstName }) : t('chat.greetingGuest')}
            </p>
            <p className="m-0 mt-2xs font-body text-body text-body-text">
              {firstName ? t('chat.greetingNamedText') : t('chat.greetingGuestText')}
            </p>
            {!isAuthenticated && (
              <div className="mt-6 w-full text-left">
                <ChatSuggestions onSelect={(question) => setInput(question)} />
              </div>
            )}
          </div>
        )}
        {messages.map((message) => <ChatMessage key={message.id} message={message} />)}
        {busy && (
          <div className="flex items-center gap-2 font-body text-caption text-(--grey-600)" aria-live="polite">
            <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-green-50 px-3 py-3">
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:-0.2s]" />
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:-0.1s]" />
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500" />
            </span>
            {t('chat.typing')}
          </div>
        )}
        {booking.active && (
          <ChatBookingOptions
            options={booking.options}
            onSelect={booking.handleOption}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      {!booking.active && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-neutral-200 bg-white px-md pb-sm pt-sm"
        >
          <div className="flex items-center gap-xs">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t('chat.placeholder')}
              maxLength={500}
              aria-label={t('chat.placeholder')}
              className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-md font-body text-body-sm text-body-text-dark outline-none placeholder:text-(--grey-700) focus:border-heading"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t('chat.send')}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendIcon size={20} aria-hidden="true" />
            </button>
          </div>
          <p className="m-0 mt-xs font-body text-[11px] leading-snug text-(--grey-600)">{t('chat.disclaimer')}</p>
        </form>
      )}

      {booking.active && booking.stage === 'data' && (
        <form
          onSubmit={handleSubmit}
          className="border-t border-neutral-200 bg-white px-md pb-sm pt-sm"
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            placeholder={t('chat.booking.dataPlaceholder')}
            maxLength={MAX_BOOKING_INPUT}
            rows={4}
            aria-label={t('chat.booking.dataPlaceholder')}
            className="w-full resize-none rounded-xl border border-neutral-200 bg-white px-md py-sm font-body text-body-sm text-body-text-dark outline-none placeholder:text-(--grey-700) focus:border-heading"
          />
          <div className="mt-xs flex items-center justify-between gap-xs">
            <p className="m-0 font-body text-[11px] leading-snug text-(--grey-600)">{t('chat.booking.dataHint')}</p>
            <button
              type="submit"
              disabled={booking.busy || !input.trim()}
              aria-label={t('chat.send')}
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <SendIcon size={18} aria-hidden="true" />
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
