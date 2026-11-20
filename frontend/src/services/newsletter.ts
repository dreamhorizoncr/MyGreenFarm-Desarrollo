import { apiClient } from './api.ts'
import type { SubscriberInfo, BroadcastEmail, NewsletterSubscriber } from '../types/newsletter'

/** Newsletter subscriptions and broadcasts (`/api/newsletter`). */
export const newsletterService = {
    /**
     * Subscribes an email to the newsletter.
     *
     * @param data - email and name
     * @returns the subscription
     */
    subscribe: async (data: SubscriberInfo): Promise<NewsletterSubscriber> => {
        const response = await apiClient.post<NewsletterSubscriber>('/newsletter/subscribe', data)
        return response.data
    },

    /**
     * @param email - email to remove from the newsletter
     * @returns the backend's confirmation
     */
    unsubscribe: async (email: string): Promise<string> => {
        const response = await apiClient.delete<string>('/newsletter/unsubscribe', {
            params: { email },
        })
        return response.data
    },

    /**
     * Stops sending the newsletter to a parent, who receives it by default.
     *
     * @param email - the parent's email
     * @returns the backend's confirmation
     */
    unsubscribeParent: async (email: string): Promise<string> => {
        const response = await apiClient.delete<string>('/parents/newsletter-subscription', {
            params: { email },
        })
        return response.data
    },

    /**
     * Emails a message to the chosen audience.
     *
     * @param data - subject, body and recipients
     * @returns the backend's confirmation
     */
    sendBroadcast: async (data: BroadcastEmail): Promise<string> => {
        const response = await apiClient.post<string>('/newsletter/broadcast', data)
        return response.data
    },

    /** @returns the emails subscribed to the newsletter */
    getSubscriberEmails: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/newsletter/subscribers')
        return response.data
    },

    /** @returns the emails of the parents who receive the newsletter */
    getParentEmails: async (): Promise<string[]> => {
        const response = await apiClient.get<string[]>('/newsletter/parents')
        return response.data
    },
}