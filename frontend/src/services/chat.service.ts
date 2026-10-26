import { apiClient } from './api'

export interface ChatRequest {
  message: string
  conversationId?: string | null
}

export interface ChatResponse {
  answer: string
  conversationId?: string | null
  blocked?: boolean
}

export async function sendChatMessage(payload: ChatRequest): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>('/chat', payload)
  return response.data
}
