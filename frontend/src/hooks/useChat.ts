import { useState, useCallback, useEffect, useRef } from 'react'
import { sendChatMessage } from '../services/chat.service'
import type { ChatResponse } from '../services/chat.service'
import { userStorage } from '../utils/userStorage'
import i18n from '../i18n'

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  content: string
  blocked?: boolean
}

const STORAGE_KEY = 'mygreenfarm_chat_history'
const STORAGE_VERSION = 1
const INTERNAL_DISCLOSURE = /\b(codigo fuente|fuente del codigo|endpoint|api interna|implementacion interna|arquitectura interna|instrucciones internas|configuracion interna)\b/i
const ACCESS_INVITATION = /(inici(?:a|ar|e)\s+sesion|ingres(?:a|ar)\s+al\s+sistema|cuenta\s+(?:que\s+tenga\s+)?acceso|solicit(?:a|ar)\s+acceso|seccion\s+correspondiente)/i

interface PersistedChat {
  version: number
  messages: ChatMessage[]
  conversationId: string | null
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function getLoggedInFirstName() {
  try {
    return userStorage.getUser()?.firstName?.trim() || ''
  } catch {
    return ''
  }
}

function isGreeting(message: string) {
  return /^(hola|buenas(?:\s+(?:tardes|noches|d[ií]as))?|buenos\s+d[ií]as)[!.?,\s]*$/i.test(message.trim())
}

function personalizeGreeting(answer: string, question: string, firstName: string) {
  if (!firstName || !isGreeting(question)) return answer
  return answer.replace(/^\s*[¡!]\s*hola[!,.:\s]*/i, `¡Hola, ${firstName}! `)
}

function sanitizeAnswer(answer: string) {
  const readable = answer
    .replace(/\*\*([^*]+)\*\*\s*\(`\/[^`]+`\)/g, '$1')
    .replace(/\[([^\]]+)\]\(\/[^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`\/[^`]+`/g, '')
    .replace(/\/(?:booking|services|clubs|news|forum|multimedia|vacantes|about-us)(?:\/[\w-]+)*/gi, '')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const normalized = readable.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (/puedo ayudarte con la informacion publica de my\s?green farm/i.test(normalized)) {
    return i18n.t('chat.greetingGuestText')
  }
  if (ACCESS_INVITATION.test(normalized)) return i18n.t('chat.privateData')
  return INTERNAL_DISCLOSURE.test(normalized) ? i18n.t('chat.safeReply') : readable
}

function loadHistory(): ChatMessage[] {
  try {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    if (navigation?.type === 'reload') {
      sessionStorage.removeItem(STORAGE_KEY)
      return []
    }

    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const stored = JSON.parse(raw) as PersistedChat | ChatMessage[]
    const history = Array.isArray(stored) ? stored : stored.messages
    const firstName = getLoggedInFirstName()
    return history.map((message, index) => {
      if (message.role !== 'bot') return message
      const previousMessage = history[index - 1]
      const content = sanitizeAnswer(message.content)
      return {
        ...message,
        content: previousMessage?.role === 'user'
          ? personalizeGreeting(content, previousMessage.content, firstName)
          : content,
      }
    })
  } catch {
    return []
  }
}

function loadConversationId(): string | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored = JSON.parse(raw) as PersistedChat | ChatMessage[]
    return Array.isArray(stored) ? null : stored.conversationId || null
  } catch {
    return null
  }
}

function saveHistory(messages: ChatMessage[], conversationId: string | null) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      messages,
      conversationId,
    } satisfies PersistedChat))
  } catch {
    // Ignore unavailable storage.
  }
}

export function useChat() {
  const closedRef = useRef(false)
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadHistory())
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(() => loadConversationId())

  useEffect(() => {
    closedRef.current = false
    return () => { closedRef.current = true }
  }, [])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    if (trimmed.length > 500) {
      const msg: ChatMessage = { id: generateId(), role: 'bot', content: i18n.t('chat.maxLength'), blocked: true }
      setMessages((prev) => {
        const next = [...prev, msg]
        saveHistory(next, conversationId)
        return next
      })
      setInput('')
      return
    }

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: trimmed }
    setMessages((prev) => {
      const next = [...prev, userMsg]
      saveHistory(next, conversationId)
      return next
    })
    setInput('')
    setLoading(true)

    try {
      const history = messages
        .slice(-12)
        .map(({ role, content }) => ({
          role: role === 'user' ? 'user' as const : 'assistant' as const,
          content,
        }))
      const res: ChatResponse = await sendChatMessage({ message: trimmed, conversationId, history })
      if (closedRef.current) return
      const nextConversationId = res.conversationId || conversationId
      if (res.conversationId) setConversationId(res.conversationId)
      const firstName = getLoggedInFirstName()
      const content = sanitizeAnswer(res.answer)
      const botMsg: ChatMessage = {
        id: generateId(),
        role: 'bot',
        content: personalizeGreeting(content, trimmed, firstName),
        blocked: res.blocked,
      }
      setMessages((prev) => {
        const next = [...prev, botMsg]
        saveHistory(next, nextConversationId)
        return next
      })
    } catch {
      if (closedRef.current) return
      const botMsg: ChatMessage = { id: generateId(), role: 'bot', content: i18n.t('chat.retry'), blocked: true }
      setMessages((prev) => {
        const next = [...prev, botMsg]
        saveHistory(next, conversationId)
        return next
      })
    } finally {
      if (!closedRef.current) setLoading(false)
    }
  }, [input, loading, conversationId, messages])

  const clearChat = useCallback(() => {
    closedRef.current = true
    setMessages([])
    setInput('')
    setLoading(false)
    setConversationId(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore unavailable storage.
    }
  }, [])

  return { messages, input, setInput, sendMessage, loading, clearChat, conversationId }
}
