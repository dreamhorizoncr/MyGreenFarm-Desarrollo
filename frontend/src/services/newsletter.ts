import { apiClient } from './api.ts'
import type { SubscriberInfo, BroadcastEmail, NewsletterSubscriber } from '../types/newsletter'

export const newsletterService = {
    subscribe: async (data: SubscriberInfo): Promise<NewsletterSubscriber> => {
        const response = await apiClient.post<NewsletterSubscriber>('/newsletter/subscribe', data)
        return response.data
    },

    unsubscribe: async (email: string): Promise<string> => {
        const response = await apiClient.delete<string>('/newsletter/unsubscribe', {
            params: { email },
        })
        return response.data
    },

    unsubscribeParent: async (email: string): Promise<string> => {
        const response = await apiClient.delete<string>('/parents/newsletter-subscription', {
            params: { email },
        })
        return response.data
    },

    sendBroadcast: async (data: BroadcastEmail): Promise<string> => {
        const response = await apiClient.post<string>('/newsletter/broadcast', data)
        return response.data
    },

    getSubscriberEmails: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/newsletter/subscribers')
        return response.data
    },

    getParentEmails: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/newsletter/parents')
        return response.data
    },
}