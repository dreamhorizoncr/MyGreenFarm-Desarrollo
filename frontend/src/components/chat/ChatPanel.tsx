import { useEffect, useRef } from 'react'
import { Send, X } from 'lucide-react'
import { useChat } from '../../hooks/useChat'
import ChatMessage from './ChatMessage'
import ChatSuggestions from './ChatSuggestions'
import rutiAssistant from '../../assets/imgs/rutiasistente.png'
import { userStorage } from '../../utils/userStorage'
import { useTranslation } from 'react-i18next'

interface ChatPanelProps {
  onClose: () => void
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const { messages, input, setInput, sendMessage, loading, clearChat } = useChat()
  const { t } = useTranslation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const user = userStorage.getUser()
  const isAuthenticated = Boolean(user)
  const firstName = user?.firstName?.trim()

  const closeChat = () => {
    clearChat()
    onClose()
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  return (
    <section className="flex h-full min-h-0 flex-col bg-white text-slate-800">
      <header className="flex min-h-[68px] shrink-0 items-center justify-between border-b border-green-600 bg-green-500 px-6 py-3 text-left text-white">
        <p className="font-heading text-xl font-bold tracking-tight">{t('chat.title')}</p>
        <button
          onClick={closeChat}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/80 text-white transition-colors hover:bg-white/15"
          aria-label={t('chat.close')}
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex flex-1 flex-col space-y-3 overflow-y-auto bg-white px-4 py-4 text-left">
        {messages.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center pt-3 text-center">
            <img
              src={rutiAssistant}
              alt={t('chat.assistantAlt')}
              className="h-36 w-40 object-contain"
            />
            <p className="mt-3 font-heading text-xl font-bold leading-snug text-emerald-600">
              {firstName ? t('chat.greetingNamed', { name: firstName }) : t('chat.greetingGuest')}<br />
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
          <div className="flex items-center gap-2 text-xs text-slate-500" aria-live="polite">
            <span className="flex gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-3 shadow-sm ring-1 ring-slate-100">
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.2s]" />
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.1s]" />
              <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-500" />
            </span>
            {t('chat.typing')}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(event) => { event.preventDefault(); sendMessage() }}
        className="border-t border-slate-100 bg-white p-3.5"
      >
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 pl-4 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-500/10">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={t('chat.placeholder')}
            maxLength={500}
            aria-label={t('chat.placeholder')}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t('chat.send')}
            className="flex h-10 w-10 shrink-0 items-center justify-center text-green-500 transition hover:text-green-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-6 w-6" strokeWidth={1.8} />
          </button>
        </div>
        <p className="mt-2 text-center font-body text-[11px] text-neutral-500">{t('chat.disclaimer')}</p>
      </form>
    </section>
  )
}
