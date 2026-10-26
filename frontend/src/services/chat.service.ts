import { apiClient } from './api'

export interface ChatRequest {
  message: string
  conversationId?: string | null
  history?: ChatTurn[]
}

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  answer: string
  conversationId?: string | null
  blocked?: boolean
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  // Gemini can take longer than the default 20 second API timeout.
  const response = await apiClient.post<ChatResponse>('/chat', payload, { timeout: 70000 })
  return response.data
}
