/** Who receives a newsletter broadcast. */
export type AudienceType = 'PARENTS' | 'SUBSCRIBERS' | 'BOTH'

/** Data to subscribe to the newsletter. */
export interface SubscriberInfo {
    email: string
    language?: string
}

/** Newsletter email to send. */
export interface BroadcastEmail {
    audienceType: AudienceType
    subject: string
    message: string
}

/** A newsletter subscription. */
export interface NewsletterSubscriber {
    id: number
    email: string
    language: string
    isActive: boolean
    createdAt?: string
}

/** A recipient of the newsletter: a subscriber or a parent. */
export interface NewsletterRecipient {
    id: string
    email: string
    type: 'SUBSCRIBER' | 'PARENT'
}