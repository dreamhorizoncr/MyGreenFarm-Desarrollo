import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { XIcon } from '@animateicons/react/lucide'
import Button from './ui/Button.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import { getErrorMessage } from '../utils/error.ts'
import type { NewsletterRecipient } from '../types/newsletter.ts'

interface ConfirmNewsletterUnsubscribeModalProps {
    recipient: NewsletterRecipient
    onConfirm: (recipient: NewsletterRecipient) => Promise<void>
    onClose: () => void
}

function ConfirmNewsletterUnsubscribeModal({ recipient, onConfirm, onClose }: Readonly<ConfirmNewsletterUnsubscribeModalProps>) {
    const { t } = useTranslation()
    const overlayRef = useRef<HTMLDivElement>(null)
    const [unsubscribing, setUnsubscribing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useDismiss({
        ref: overlayRef,
        isOpen: true,
        onClose,
        includeClickOutside: false,
    })

    const handleConfirm = async () => {
        setUnsubscribing(true)
        setError(null)
        try {
            await onConfirm(recipient)
            onClose()
        } catch (err) {
            setError(getErrorMessage(err))
        } finally {
            setUnsubscribing(false)
        }
    }

    const handleOverlayClick = (event: React.MouseEvent) => {
        if (event.target === overlayRef.current) onClose()
    }

    return (
        <div
            className="fixed inset-0 z-100 grid place-items-center bg-scrim p-lg animate-[modal-overlay-in_0.15s_ease-out]"
            ref={overlayRef}
            onClick={handleOverlayClick}
        >
            <div
                className="relative w-[min(620px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl bg-bg-card p-[28px_22px_30px] animate-[modal-in_0.2s_ease-out]"
                role="dialog"
                aria-modal="true"
                aria-labelledby="newsletter-unsubscribe-title"
            >
                <button
                    type="button"
                    className="absolute right-3 top-6.5 z-10 inline-flex size-10 items-center justify-center rounded-full bg-transparent text-body-text transition-opacity duration-150 hover:opacity-65 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2"
                    onClick={onClose}
                    aria-label={t('admin.cancel', 'Cancelar')}
                >
                    <XIcon size={20} aria-hidden="true" />
                </button>

                <div className="relative mb-lg text-center">
                    <h2 id="newsletter-unsubscribe-title" className="m-0 font-heading text-[34px] font-bold leading-tight text-heading">
                        {t('admin.newsletter.unsubscribeConfirmTitle')}
                    </h2>
                </div>

                <div className="flex flex-col gap-md px-7 pb-8 pt-2.5">
                    <p className="m-0 break-all text-left font-body text-[15px] text-body-text">
                        {t('admin.newsletter.unsubscribeConfirmMessage', { email: recipient.email })}
                    </p>

                    {error && <p className="m-0 text-left font-body text-sm text-danger">{error}</p>}

                    <div className="mt-sm flex gap-md">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={unsubscribing}
                            className="h-11.75 flex-1 rounded-full font-body text-[17px] uppercase tracking-wide"
                        >
                            {t('admin.cancel', 'Cancelar')}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleConfirm}
                            loading={unsubscribing}
                            className="h-11.75 flex-1 rounded-full bg-danger font-body text-[17px] font-normal uppercase tracking-wide"
                        >
                            {t('admin.newsletter.unsubscribe')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ConfirmNewsletterUnsubscribeModal