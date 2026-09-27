import { useCallback, useState } from 'react'
import { newsletterService } from '../services/newsletter.ts'
import { getErrorMessage } from '../utils/error.ts'
import i18n from '../i18n/index.ts'
import type { BroadcastEmail, NewsletterRecipient } from '../types/newsletter.ts'

function currentLang(): string {
    return (i18n.language ?? 'es').split('-')[0] ?? 'es'
}

export function useNewsletter() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    // Acción para suscribir un correo
    const subscribe = useCallback(async (email: string) => {
        setLoading(true)
        setError(null)
        setSuccessMessage(null)
        try {
            await newsletterService.subscribe({
                email,
                language: currentLang(),
            })
            setSuccessMessage(i18n.t('home.join.subscribeSuccess'))
        } catch (err) {
            const message = getErrorMessage(err)
            setError(message)
            throw new Error(message, { cause: err })
        } finally {
            setLoading(false)
        }
    }, [])

    const unsubscribe = useCallback(async (email: string) => {
        setLoading(true)
        setError(null)
        setSuccessMessage(null)
        try {
            await newsletterService.unsubscribe(email)
            setSuccessMessage('Te has desuscrito exitosamente del boletín.')
        } catch (err) {
            const message = getErrorMessage(err)
            setError(message)
            throw new Error(message, { cause: err })
        } finally {
            setLoading(false)
        }
    }, [])

    const unsubscribeParent = useCallback(async (email: string) => {
        setLoading(true)
        setError(null)
        setSuccessMessage(null)
        try {
            await newsletterService.unsubscribeParent(email)
            setSuccessMessage('El padre se ha desuscrito del boletín.')
        } catch (err) {
            const message = getErrorMessage(err)
            setError(message)
            throw new Error(message, { cause: err })
        } finally {
            setLoading(false)
        }
    }, [])

    // Acción para enviar el correo masivo (Broadcast)
    const sendBroadcast = useCallback(async (data: BroadcastEmail) => {
        setLoading(true)
        setError(null)
        setSuccessMessage(null)
        try {
            await newsletterService.sendBroadcast(data)
            setSuccessMessage('Correo masivo enviado exitosamente.')
        } catch (err) {
            const message = getErrorMessage(err)
            setError(message)
            throw new Error(message, { cause: err })
        } finally {
            setLoading(false)
        }
    }, [])

    const getSubscribers = useCallback(async (): Promise<NewsletterRecipient[]> => {
        setLoading(true)
        setError(null)
        try {
            const [subscriberEmails, parentEmails] = await Promise.all([
                newsletterService.getSubscriberEmails(),
                newsletterService.getParentEmails(),
            ])

            return [
                ...subscriberEmails.map((email) => ({
                    id: `SUBSCRIBER:${email}`,
                    email,
                    type: 'SUBSCRIBER' as const,
                })),
                ...parentEmails.map((email) => ({
                    id: `PARENT:${email}`,
                    email,
                    type: 'PARENT' as const,
                })),
            ]
        } catch (err) {
            const message = getErrorMessage(err)
            setError(message)
            throw new Error(message, { cause: err })
        } finally {
            setLoading(false)
        }
    }, [])

    return {
        loading,
        error,
        successMessage,
        subscribe,
        unsubscribe,
        unsubscribeParent,
        sendBroadcast,
        getSubscribers,
    }
}