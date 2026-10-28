import { useEffect, useRef, useState, type FormEvent } from 'react'
import { SendIcon, XIcon } from '@animateicons/react/lucide'
import { useChat } from '../../hooks/useChat'
import ChatMessage from './ChatMessage'
import ChatSuggestions from './ChatSuggestions'
import ChickAvatar, { type ChickMood, type ChickReaction, type ChickState } from './ChickAvatar'
import { userStorage } from '../../utils/userStorage'
import { useTranslation } from 'react-i18next'
import { animationsStopped } from '../../utils/reducedMotion'

const THANKS_PATTERN = /\b(gracias|thanks|thank you|merci)\b/i
const WORD_PATTERN = /\S+\s*/y

function nextWordEnd(text: string, from: number) {
  WORD_PATTERN.lastIndex = from
  const match = WORD_PATTERN.exec(text)
  return match ? from + match[0].length : text.length
}

interface ChatPanelProps {
  onClose: () => void
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const { messages, input, setInput, sendMessage, loading } = useChat()
  const { t } = useTranslation()
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

  const react = (type: ChickReaction) => setReaction((current) => ({ type, key: (current?.key ?? 0) + 1 }))

  const showMood = (next: ChickMood, duration: number) => {
    window.clearTimeout(moodTimer.current)
    setMood(next)
    moodTimer.current = window.setTimeout(() => setMood('neutral'), duration)
  }

  useEffect(() => () => window.clearTimeout(moodTimer.current), [])

  useEffect(() => {
    const last = messages.at(-1)
    if (!last || last.role !== 'bot' || last.id === lastBotId.current) return
    lastBotId.current = last.id
    const timer = window.setTimeout(() => {
      if (last.blocked) {
        showMood('worried', 3500)
        react('shake')
      } else if (animationsStopped()) {
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

  let chickState: ChickState = 'idle'
  if (loading) chickState = 'thinking'
  else if (talk) chickState = 'speaking'
  else if (focused && input.trim()) chickState = 'listening'
  const talkTick = talk?.shown ?? 0

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (THANKS_PATTERN.test(input)) react('thanks')
    sendMessage()
  }

  const closeChat = () => {
    onClose()
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <section className="flex h-full min-h-0 flex-col bg-white text-body-text-dark">
      <header className="flex min-h-[68px] shrink-0 items-center justify-between border-b border-green-600 bg-green-500 px-6 py-3 text-left text-white">
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
        {loading && (
          <div className="flex items-center gap-2 font-body text-caption text-[var(--grey-600)]" aria-live="polite">
            <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-green-50 px-3 py-3">
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:-0.2s]" />
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:-0.1s]" />
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500" />
            </span>
            {t('chat.typing')}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
            className="h-11 min-w-0 flex-1 rounded-xl border border-neutral-200 bg-white px-md font-body text-body-sm text-body-text-dark outline-none placeholder:text-[var(--grey-700)] focus:border-heading"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t('chat.send')}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SendIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="m-0 mt-xs font-body text-[11px] leading-snug text-[var(--grey-600)]">{t('chat.disclaimer')}</p>
      </form>
    </section>
  )
}
