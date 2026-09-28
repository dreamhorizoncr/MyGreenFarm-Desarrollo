export type AudienceType = 'PARENTS' | 'SUBSCRIBERS' | 'BOTH'

export interface SubscriberInfo {
    email: string
    language?: string
}

export interface BroadcastEmail {
    audienceType: AudienceType
    subject: string
    message: string
}

export interface NewsletterSubscriber {
    id: number
    email: string
    language: string
    isActive: boolean
    createdAt?: string
}

export interface NewsletterRecipient {
    id: string
    email: string
    type: 'SUBSCRIBER' | 'PARENT'
}