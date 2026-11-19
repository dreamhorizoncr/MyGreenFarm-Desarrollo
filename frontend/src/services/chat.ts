import { apiClient } from './api'

/** Message sent to the site's assistant. */
export interface ChatRequest {
  message: string
  /** ID returned by the previous answer, to keep the same conversation. */
  conversationId?: string | null
  /** Previous turns, so the assistant has the context. */
  history?: ChatTurn[]
}

/** One turn of a conversation with the assistant. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** Answer of the assistant. */
export interface ChatResponse {
  answer: string
  conversationId?: string | null
  /** True when the message was rejected by the moderation. */
  blocked?: boolean
  /** Action the page should take, for example opening the booking form. */
  action?: string | null
  /** Target of `action`, for example the route to open. */
  target?: string | null
}

/**
 * Sends a message to the assistant.
 *
 * @param payload - the message and the conversation so far
 * @returns the assistant's answer
 */
export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  // Gemini can take longer than the default 20 second API timeout.
  const response = await apiClient.post<ChatResponse>('/chat', payload, { timeout: 70000 })
  return response.data
}
